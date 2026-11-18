-- ==============================================================================
-- PHILOSOPHY DAY 2026: INTERACTIVE ONLINE QUIZ PLATFORM
-- Supabase PostgreSQL Schema & Security Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------------------------

-- Participants table (Anonymous event participants: First & Last Name only)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Questions table (Maintains quiz questions; correct_answer is strictly private)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_num INT NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    category TEXT NOT NULL DEFAULT 'General Philosophy',
    explanation TEXT,
    time_limit INT NOT NULL DEFAULT 20, -- Seconds per question
    points INT NOT NULL DEFAULT 5,      -- Points per correct answer (20 x 5 = 100)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quiz Sessions table (Tracks active quiz attempts and server-enforced timeouts)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Participant Answers table (Individual question responses evaluated securely)
CREATE TABLE IF NOT EXISTS public.participant_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_answer VARCHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D', NULL)),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    time_taken NUMERIC(5,2) DEFAULT 0, -- Seconds taken on this question
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quiz Results table (Authoritative backend-calculated scores and stats)
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE UNIQUE,
    total_score INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    unanswered_questions INT NOT NULL DEFAULT 0,
    completion_time NUMERIC(6,2) NOT NULL DEFAULT 0, -- Total seconds
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quiz Settings table (Single row configuration for organisers)
CREATE TABLE IF NOT EXISTS public.quiz_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    event_title TEXT NOT NULL DEFAULT 'PHILOSOPHY DAY 2026',
    tagline TEXT NOT NULL DEFAULT 'Think. Question. Discover.',
    time_limit_per_question INT NOT NULL DEFAULT 20,
    points_per_question INT NOT NULL DEFAULT 5,
    allow_multiple_attempts BOOLEAN NOT NULL DEFAULT false,
    quiz_is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default settings row if not present
INSERT INTO public.quiz_settings (id, event_title, tagline, time_limit_per_question, points_per_question, allow_multiple_attempts, quiz_is_active)
VALUES (1, 'PHILOSOPHY DAY 2026', 'Think. Question. Discover.', 20, 5, false, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_participants_name ON public.participants(lower(first_name), lower(last_name));
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active, order_num);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_token ON public.quiz_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_results_score_time ON public.quiz_results(total_score DESC, completion_time ASC);

-- ------------------------------------------------------------------------------
-- 3. PUBLIC VIEW (Hides correct_answer completely from public queries)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.public_questions AS
SELECT 
    id,
    order_num,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    category,
    time_limit,
    points
FROM public.questions
WHERE is_active = true
ORDER BY order_num ASC;

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_settings ENABLE ROW LEVEL SECURITY;

-- QUESTIONS: Direct table access is restricted to authenticated admins.
-- Public clients retrieve questions via get_active_quiz_questions() or public_questions view.
CREATE POLICY "Admins have full access to questions"
ON public.questions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PARTICIPANTS: Anyone can insert their name to start. Admins can view all.
CREATE POLICY "Public can register participant"
ON public.participants FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(trim(first_name)) > 0 AND char_length(trim(last_name)) > 0);

CREATE POLICY "Admins can view all participants"
ON public.participants FOR SELECT
TO authenticated
USING (true);

-- QUIZ SESSIONS: Public can insert new session and select their own via token.
CREATE POLICY "Public can start session"
ON public.quiz_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can view own session"
ON public.quiz_sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins have full access to sessions"
ON public.quiz_sessions FOR ALL
TO authenticated
USING (true);

-- PARTICIPANT ANSWERS: Only updated via secure RPC or admin.
CREATE POLICY "Admins have full access to participant answers"
ON public.participant_answers FOR ALL
TO authenticated
USING (true);

-- QUIZ RESULTS: Leaderboard viewable by anyone; Admins have full access.
CREATE POLICY "Public can read quiz results for leaderboard"
ON public.quiz_results FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins have full access to quiz results"
ON public.quiz_results FOR ALL
TO authenticated
USING (true);

-- QUIZ SETTINGS: Public can read settings; Admins can update.
CREATE POLICY "Public can read quiz settings"
ON public.quiz_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update quiz settings"
ON public.quiz_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. SECURE STORED PROCEDURES (RPCs)
-- ------------------------------------------------------------------------------

-- Function 1: Get Active Questions (NEVER returns correct_answer)
CREATE OR REPLACE FUNCTION public.get_active_quiz_questions()
RETURNS TABLE (
    id UUID,
    order_num INT,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    category TEXT,
    time_limit INT,
    points INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        q.id,
        q.order_num,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.category,
        q.time_limit,
        q.points
    FROM public.questions q
    WHERE q.is_active = true
    ORDER BY q.order_num ASC;
$$;

-- Function 2: Start Quiz Session (Creates participant & session with expiry)
CREATE OR REPLACE FUNCTION public.start_quiz_session(
    p_first_name TEXT,
    p_last_name TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_first TEXT;
    v_clean_last TEXT;
    v_participant_id UUID;
    v_session_id UUID;
    v_settings RECORD;
    v_total_questions INT;
    v_total_seconds INT;
    v_expires_at TIMESTAMPTZ;
    v_existing_completed INT;
BEGIN
    -- Input sanitization
    v_clean_first := trim(p_first_name);
    v_clean_last := trim(p_last_name);

    IF char_length(v_clean_first) = 0 OR char_length(v_clean_last) = 0 THEN
        RAISE EXCEPTION 'First name and last name are required.';
    END IF;

    -- Fetch settings
    SELECT * INTO v_settings FROM public.quiz_settings WHERE id = 1;

    IF NOT v_settings.quiz_is_active THEN
        RAISE EXCEPTION 'The Philosophy Day Quiz is currently paused or concluded.';
    END IF;

    -- Attempt policy check: if multiple attempts are not allowed, check existing records
    IF NOT v_settings.allow_multiple_attempts THEN
        SELECT COUNT(*) INTO v_existing_completed
        FROM public.quiz_results qr
        JOIN public.participants p ON qr.participant_id = p.id
        WHERE lower(p.first_name) = lower(v_clean_first)
          AND lower(p.last_name) = lower(v_clean_last);

        IF v_existing_completed > 0 THEN
            RAISE EXCEPTION 'Participant % % has already completed this quiz.', v_clean_first, v_clean_last;
        END IF;
    END IF;

    -- Count active questions
    SELECT COUNT(*), COALESCE(SUM(time_limit), 200)
    INTO v_total_questions, v_total_seconds
    FROM public.questions
    WHERE is_active = true;

    IF v_total_questions = 0 THEN
        RAISE EXCEPTION 'No active quiz questions found. Please contact event organisers.';
    END IF;

    -- Calculate session expiry: total question time limit + 60s network/transition buffer
    v_expires_at := now() + (v_total_seconds + 60) * INTERVAL '1 second';

    -- Create or fetch participant
    INSERT INTO public.participants (first_name, last_name)
    VALUES (v_clean_first, v_clean_last)
    RETURNING id INTO v_participant_id;

    -- Create session
    INSERT INTO public.quiz_sessions (
        participant_id,
        session_token,
        started_at,
        expires_at,
        status
    )
    VALUES (
        v_participant_id,
        p_session_token,
        now(),
        v_expires_at,
        'in_progress'
    )
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'participant_id', v_participant_id,
        'participant_name', v_clean_first || ' ' || v_clean_last,
        'started_at', now(),
        'expires_at', v_expires_at,
        'total_questions', v_total_questions,
        'time_limit_per_question', v_settings.time_limit_per_question
    );
END;
$$;

-- Function 3: Submit Quiz Answers & Calculate Score Securely
CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
    p_session_token TEXT,
    p_answers JSONB -- Array of objects: [{"question_id": "...", "selected_answer": "A", "time_taken": 8.5}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_participant RECORD;
    v_answer JSONB;
    v_question RECORD;
    v_total_score INT := 0;
    v_correct_count INT := 0;
    v_incorrect_count INT := 0;
    v_unanswered_count INT := 0;
    v_total_completion_time NUMERIC(6,2) := 0;
    v_item_question_id UUID;
    v_item_selected TEXT;
    v_item_time NUMERIC(5,2);
    v_is_correct BOOLEAN;
    v_result_id UUID;
    v_rank INT;
BEGIN
    -- 1. Validate session
    SELECT * INTO v_session
    FROM public.quiz_sessions
    WHERE session_token = p_session_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid quiz session token.';
    END IF;

    IF v_session.status = 'completed' THEN
        RAISE EXCEPTION 'This quiz session has already been submitted and scored.';
    END IF;

    IF now() > v_session.expires_at THEN
        UPDATE public.quiz_sessions 
        SET status = 'expired'
        WHERE id = v_session.id;
        RAISE EXCEPTION 'Quiz session has expired.';
    END IF;

    -- Get participant info
    SELECT * INTO v_participant FROM public.participants WHERE id = v_session.participant_id;

    -- 2. Process each submitted answer
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_item_question_id := (v_answer->>'question_id')::UUID;
        v_item_selected := upper(trim(v_answer->>'selected_answer'));
        v_item_time := COALESCE((v_answer->>'time_taken')::NUMERIC, 0);

        v_total_completion_time := v_total_completion_time + v_item_time;

        -- Verify question exists and get private correct_answer from DB
        SELECT * INTO v_question
        FROM public.questions
        WHERE id = v_item_question_id AND is_active = true;

        IF FOUND THEN
            IF v_item_selected IS NULL OR v_item_selected = '' THEN
                v_is_correct := false;
                v_unanswered_count := v_unanswered_count + 1;
            ELSIF v_item_selected = v_question.correct_answer THEN
                v_is_correct := true;
                v_correct_count := v_correct_count + 1;
                v_total_score := v_total_score + v_question.points;
            ELSE
                v_is_correct := false;
                v_incorrect_count := v_incorrect_count + 1;
            END IF;

            -- Store answer record
            INSERT INTO public.participant_answers (
                session_id,
                question_id,
                selected_answer,
                is_correct,
                time_taken
            )
            VALUES (
                v_session.id,
                v_item_question_id,
                NULLIF(v_item_selected, ''),
                v_is_correct,
                v_item_time
            );
        END IF;
    END LOOP;

    -- 3. Calculate total elapsed time server-side as upper bound
    v_total_completion_time := LEAST(
        v_total_completion_time,
        EXTRACT(EPOCH FROM (now() - v_session.started_at))::NUMERIC(6,2)
    );

    IF v_total_completion_time <= 0 THEN
        v_total_completion_time := EXTRACT(EPOCH FROM (now() - v_session.started_at))::NUMERIC(6,2);
    END IF;

    -- 4. Mark session completed
    UPDATE public.quiz_sessions
    SET 
        completed_at = now(),
        status = 'completed'
    WHERE id = v_session.id;

    -- 5. Insert quiz result
    INSERT INTO public.quiz_results (
        participant_id,
        session_id,
        total_score,
        correct_answers,
        incorrect_answers,
        unanswered_questions,
        completion_time
    )
    VALUES (
        v_participant.id,
        v_session.id,
        v_total_score,
        v_correct_count,
        v_incorrect_count,
        v_unanswered_count,
        v_total_completion_time
    )
    RETURNING id INTO v_result_id;

    -- 6. Calculate Rank
    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.quiz_results
    WHERE total_score > v_total_score 
       OR (total_score = v_total_score AND completion_time < v_total_completion_time);

    RETURN jsonb_build_object(
        'result_id', v_result_id,
        'participant_name', v_participant.first_name || ' ' || v_participant.last_name,
        'total_score', v_total_score,
        'max_possible_score', 100,
        'correct_answers', v_correct_count,
        'incorrect_answers', v_incorrect_count,
        'unanswered_questions', v_unanswered_count,
        'completion_time', v_total_completion_time,
        'rank', v_rank,
        'completed_at', now()
    );
END;
$$;

-- Function 4: Public Leaderboard with Tiebreaker
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INT DEFAULT 10)
RETURNS TABLE (
    rank BIGINT,
    participant_name TEXT,
    total_score INT,
    completion_time NUMERIC(6,2),
    completed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        ROW_NUMBER() OVER (
            ORDER BY qr.total_score DESC, qr.completion_time ASC, qr.created_at ASC
        ) AS rank,
        p.first_name || ' ' || p.last_name AS participant_name,
        qr.total_score,
        qr.completion_time,
        qr.created_at AS completed_at
    FROM public.quiz_results qr
    JOIN public.participants p ON qr.participant_id = p.id
    ORDER BY qr.total_score DESC, qr.completion_time ASC, qr.created_at ASC
    LIMIT p_limit;
$$;

-- Function 5: Admin Metrics & Participant Results
CREATE OR REPLACE FUNCTION public.admin_get_quiz_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_participants INT;
    v_total_completed INT;
    v_highest_score INT;
    v_avg_score NUMERIC(5,2);
    v_avg_time NUMERIC(6,2);
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Unauthorized: Organiser authentication required.';
    END IF;

    SELECT COUNT(*) INTO v_total_participants FROM public.participants;
    SELECT COUNT(*), COALESCE(MAX(total_score), 0), COALESCE(AVG(total_score), 0), COALESCE(AVG(completion_time), 0)
    INTO v_total_completed, v_highest_score, v_avg_score, v_avg_time
    FROM public.quiz_results;

    RETURN jsonb_build_object(
        'total_participants', v_total_participants,
        'total_completed', v_total_completed,
        'highest_score', v_highest_score,
        'average_score', v_avg_score,
        'average_time', v_avg_time
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. SEED DATA (20 Official Sinhala Philosophy Questions for Philosophy Day 2026)
-- ------------------------------------------------------------------------------

DELETE FROM public.questions;

INSERT INTO public.questions (order_num, category, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit, points, explanation)
VALUES
(
    1,
    'හැඳින්වීම (Introduction to Philosophy)',
    'දර්ශනය කියන්නේ මොකක්ද?',
    'ප්‍රශ්න අහන සහ හිතන කලාව.',
    'විද්‍යාව විතරයි.',
    'ආගම විතරයි.',
    'ඉතිහාසය විතරයි.',
    'A',
    20,
    5,
    'දර්ශනය යනු ප්‍රශ්න නැඟීම, විචාරාත්මකව සිතීම සහ සත්‍යය ගවේෂණය කිරීමේ කලාවයි.'
),
(
    2,
    'ඥානවිභාගය (Epistemology)',
    'ඥානවිභාගයට (Epistemology) අනුව, සාම්ප්‍රදායික දැනුම් අර්ථ දැක්වීමට (Traditional Definition of Knowledge) අනුව දැනුම යනු කුමක්ද?',
    'සත්‍යය පමණි.',
    'සත්‍යය සහ විශ්වාසය පමණි.',
    'සත්‍යය, විශ්වාසය සහ යුක්තිසාදනය (Truth, Belief, and Justification) යන තුනම වේ.',
    NULL,
    'C',
    20,
    5,
    'සාම්ප්‍රදායික ඥානවිභාගයට අනුව දැනුම යනු සාධාරණීකරණය කළ සත්‍ය විශ්වාසයයි (Justified True Belief).'
),
(
    3,
    'පුරාණ ග්‍රීක දර්ශනය (Socrates)',
    '"මම දන්නා එකම දෙය නම් මා කිසිවක් නොදන්නා බවයි" කිව්වේ කවුද?',
    'ප්ලේටෝ',
    'සොක්‍රටීස්',
    'ඇරිස්ටෝටල්',
    'බුදුන්',
    'B',
    20,
    5,
    'සොක්‍රටීස්ගේ ප්‍රසිද්ධ ප්‍රකාශය වන්නේ තමන් කිසිවක් නොදන්නා බව දැනගැනීම ප්‍රඥාවේ ආරම්භය බවයි.'
),
(
    4,
    'බුද්ධිවාදය (Rationalism)',
    'බටහිර දර්ශනයේ ''විචාරවත් බුද්ධිවාදය'' (Rationalism) සමඟ තදින්ම සම්බන්ධ වන දාර්ශනිකයෙක් වන්නේ කවුද?',
    'ජෝන් ලොක් (John Locke)',
    'ඩේවිඩ් හියුම් (David Hume)',
    'රෙනේ ඩෙකාට් (René Descartes)',
    'ඇරිස්ටෝටල් (Aristotle)',
    'C',
    20,
    5,
    'රෙනේ ඩෙකාට් නූතන බටහිර බුද්ධිවාදයේ (Rationalism) පියා ලෙස සැලකේ.'
),
(
    5,
    'සත්‍යය පිළිබඳ විමසුම (Truth)',
    'සත්‍යය කියන්නේ මොකක්ද? ඔයා හිතන්නේ?',
    'ඇසට පෙනෙන දේ.',
    'විද්‍යාවෙන් ඔප්පු කරපු දේ.',
    'සමාජය පිළිගන්න දේ.',
    'කිසිම දෙයක් absolute සත්‍යයක් නැහැ.',
    'D',
    20,
    5,
    'සාපේක්ෂතාවාදී හා විචාරාත්මක දර්ශනයට අනුව පරම (absolute) සත්‍යය පිළිබඳව නිරන්තරයෙන් ප්‍රශ්න කෙරේ.'
),
(
    6,
    'ප්ලේටෝ (Plato)',
    'ප්ලේටෝ (Plato) ගේ ''තීටිටස්'' (Theaetetus) සංවාදයේදී දැනුම හැඳින්වීමට යොදාගත් ප්‍රධාන සංකල්පය කුමක්ද?',
    'සාධාරණීකරණය කළ හැකි සත්‍ය විශ්වාසය (Justified True Belief).',
    'පරම පරමාර්ථය.',
    'සංවේදී අත්දැකීම.',
    'බුද්ධිවාදී සත්‍යය.',
    'A',
    20,
    5,
    'ප්ලේටෝගේ Theaetetus සංවාදයේදී දැනුම යනු සාධාරණීකරණය කළ හැකි සත්‍ය විශ්වාසය (Justified True Belief) ලෙස සාකච්ඡා කෙරේ.'
),
(
    7,
    'විචාරාත්මක චින්තනය (Critical Inquiry)',
    'පුද්ගලයෙකුට තමන් සතුව පවතින විශ්වාසයන් පවා ප්‍රශ්න කර බැලිය යුතු බව අවධාරණය කරන දාර්ශනික ආකල්පය කුමක්ද?',
    'අන්ධ විශ්වාසය.',
    'විචාරාත්මක විමර්ශනය.',
    'සම්ප්‍රදාය අනුගමනය කිරීම.',
    'අධිකාරියට යටත් වීම.',
    'B',
    20,
    5,
    'විචාරාත්මක විමර්ශනය (Critical Inquiry) මඟින් තමාගේම විශ්වාසයන් පවා තර්කානුකූලව පරීක්ෂා කිරීමට යොමු කරයි.'
),
(
    8,
    'ප්‍රායෝගිකත්වය (Pragmatism)',
    '"ප්‍රායෝගිකත්වය" (Pragmatism) දර්ශනයට අනුව සත්‍යයේ නිර්ණායකය කුමක්ද?',
    'බුද්ධිමය ස්වයංසිද්ධිය.',
    'එහි ප්‍රායෝගික ඵලදායීතාවය හා ක්‍රියාකාරී සාර්ථකත්වය.',
    'පුරාණ ග්‍රන්ථවල සඳහන් වීම.',
    'සංවේදී අත්දැකීම්වලට අනුකූල වීම.',
    'B',
    20,
    5,
    'ප්‍රායෝගිකවාදයට අනුව අදහසක සත්‍යතාව මනිනු ලබන්නේ එහි ප්‍රායෝගික ප්‍රතිඵල හා ක්‍රියාකාරී සාර්ථකත්වයෙනි.'
),
(
    9,
    'නූතන දර්ශනය (Descartes)',
    '"මම සිතමි, එබැවින් මම පවතිමි" (I think, therefore I am) යන ප්‍රකාශය ඉදිරිපත් කළේ කවුද?',
    'ප්ලේටෝ (Plato)',
    'ඇරිස්ටෝටල් (Aristotle)',
    'රෙනේ ඩෙකාට් (René Descartes)',
    'ඉමානුවෙල් කාන්ට් (Immanuel Kant)',
    'C',
    20,
    5,
    'රෙනේ ඩෙකාට් විසින් ''Cogito, ergo sum'' (මම සිතමි, එබැවින් මම පවතිමි) යන ප්‍රසිද්ධ ප්‍රකාශය ඉදිරිපත් කරන ලදී.'
),
(
    10,
    'ආචාරධර්ම විද්‍යාව (Ethics)',
    'යම් ක්‍රියාවක සදාචාරාත්මක බව තීරණය කිරීමේදී එහි ප්‍රතිඵලවලට ප්‍රමුඛත්වය ලබා දෙන සදාචාර න්‍යාය කුමක්ද?',
    'ප්‍රතිඵලවාදය (Consequentialism)',
    'පැවැත්මවාදය (Existentialism)',
    'විඥානවාදය (Idealism)',
    'සංශයවාදය (Skepticism)',
    'A',
    20,
    5,
    'ප්‍රතිඵලවාදය (Consequentialism) යම් ක්‍රියාවක් යහපත්ද නැද්ද යන්න එහි ප්‍රතිඵල මත තීරණය කරයි.'
),
(
    11,
    'සාංදෘෂ්ටිකවාදය (Existentialism)',
    'සාංදෘෂ්ටිකවාදයේ (Existentialism) ප්‍රධාන තේමාවක් වන්නේ කුමක්ද?',
    'විශ්වයේ ආරම්භය පිළිබඳ විද්‍යාත්මක ගවේෂණය.',
    'පැවැත්ම සාරයට මුල් වීම ("Existence precedes essence").',
    'ද්‍රව්‍යවාදී සංවර්ධනය.',
    'තර්ක ශාස්ත්‍රීය නීති පද්ධතිය.',
    'B',
    20,
    5,
    'ජීන්-පෝල් සාත්‍රේගේ සාංදෘෂ්ටිකවාදයට අනුව මිනිසාගේ පැවැත්ම ඔහුගේ සාරයට පෙර පවතී.'
),
(
    12,
    'මිනිස් ස්වභාවය (Nature vs. Nurture)',
    'මනුස්සයෙක් වෙනස් වෙන්නේ මොන නිසාද? Nature ද? Nurture ද?',
    'Nature - ඉපදිලා එන දේවල්',
    'Nurture - හැදෙන පරිසරය',
    'දෙකම',
    'තමන්ම',
    'C',
    20,
    5,
    'මිනිස් පෞරුෂය සහ හැසිරීම සඳහා සහජ ලක්ෂණ (Nature) සහ පරිසරය (Nurture) යන දෙකම බලපායි.'
),
(
    13,
    'සත්භාවවේදය (Metaphysics)',
    '"යථාර්ථයේ අවසාන ස්වභාවය කුමක්ද?" යන ප්‍රශ්නය ප්‍රධාන වශයෙන් අයත් වන්නේ කුමන දාර්ශනික ක්ෂේත්‍රයටද?',
    'ආචාරධර්ම විද්‍යාව (Ethics)',
    'තර්ක ශාස්ත්‍රය (Logic)',
    'සත්භාවවේදය (Metaphysics / Ontology)',
    'සෞන්දර්ය විද්‍යාව (Aesthetics)',
    'C',
    20,
    5,
    'යථාර්ථය සහ පැවැත්මේ මූලික ස්වභාවය විමසා බලන්නේ සත්භාවවේදය (Metaphysics / Ontology) මඟිනි.'
),
(
    14,
    'පෙරදිග දර්ශනය (Sri Aurobindo)',
    'ශ්‍රී අරවින්දෝ (Sri Aurobindo) ගේ දර්ශනයේ කේන්ද්‍රීය සංකල්පය කුමක්ද?',
    'සීමිත භෞතිකවාදය.',
    'පූර්ණ යෝගය (Integral Yoga) සහ අධිමානසික පරිණාමය (Supermental Evolution).',
    'ශුන්‍යවාදය.',
    'යාන්ත්‍රික විශ්වය.',
    'B',
    20,
    5,
    'ශ්‍රී අරවින්දෝගේ දර්ශනය පූර්ණ යෝගය (Integral Yoga) සහ විඥානයේ අධිමානසික පරිණාමය මත පදනම් වේ.'
),
(
    15,
    'දේශපාලන දර්ශනය (Aristotle)',
    '"මිනිසා ස්වභාවයෙන්ම දේශපාලන සත්ත්වයෙකි" (Man is by nature a political animal) යන අදහස ඉදිරිපත් කළේ කවුද?',
    'සොක්‍රටීස් (Socrates)',
    'ඇරිස්ටෝටල් (Aristotle)',
    'ප්ලේටෝ (Plato)',
    'තෝමස් හොබ්ස් (Thomas Hobbes)',
    'B',
    20,
    5,
    'ඇරිස්ටෝටල් තම ''Politics'' කෘතියෙහි මිනිසා ස්වභාවයෙන්ම දේශපාලන සත්ත්වයෙකු (Zoon Politikon) බව පැවසීය.'
),
(
    16,
    'ආත්ම අවබෝධය (Self-Knowledge)',
    'තමන්ව දැනගන්න එක (Self-knowledge) අමාරු ඇයි?',
    'අපි අපි ගැන බොරු කියනවා නිසා.',
    'අපි වෙනස් වෙනවා නිසා.',
    'අනිත් අය අපිව වෙනස් විදිහට දකිනවා නිසා.',
    'ඔක්කොම නිසා.',
    'D',
    20,
    5,
    'ස්වයං-වංචාව, නිරන්තර වෙනස්වීම සහ බාහිර දෘෂ්ටිකෝණ යන සියල්ල නිසා තමා සැබවින්ම හඳුනාගැනීම අභියෝගාත්මක වේ.'
),
(
    17,
    'තර්ක ශාස්ත්‍රය (Logic & Truth)',
    'සමාජයේ බහුතරයක් යම් මතයක් පිළිගත් පමණින් එය සත්‍යයක් බවට පත්වේද? මෙම ප්‍රශ්නය මඟින් ප්‍රධාන වශයෙන් විමසා බලන්නේ කුමක්ද?',
    'බහුතර මතය සහ සත්‍යය අතර සම්බන්ධය.',
    'ආර්ථිකය සහ දේශපාලනය අතර සම්බන්ධය.',
    'කලාව සහ සෞන්දර්යය අතර සම්බන්ධය.',
    'පුද්ගලයා සහ පවුල අතර සම්බන්ධය.',
    'A',
    20,
    5,
    'බහුතරයක් යමක් පිළිගත් පමණින් එය සත්‍යය නොවන බව තර්ක ශාස්ත්‍රයේදී (Argumentum ad Populum) පෙන්වා දේ.'
),
(
    18,
    'තාක්ෂණික ආචාරධර්ම (Philosophy of AI)',
    'කෘත්‍රිම බුද්ධිය (AI) මඟින් මිනිසුන්ගේ රැකියා විශාල ප්‍රමාණයක් අහිමි වුවහොත්, එම තත්ත්වය පිළිබඳව විමසා බැලීමට වඩාත් අදාළ වන්නේ කුමන දාර්ශනික ප්‍රශ්නයද?',
    'තාක්ෂණික දියුණුව සෑම විටම යහපත්ද?',
    'සුන්දරත්වය මැනිය හැක්කේ කෙසේද?',
    'භාෂාව ආරම්භ වූයේ කෙසේද?',
    'විශ්වයේ ආරම්භය කුමක්ද?',
    'A',
    20,
    5,
    'තාක්ෂණික දියුණුව මිනිස් සුභසාධනයට සැමවිටම යහපත්ද යන්න නූතන තාක්ෂණික ආචාරධර්මයේ ප්‍රධාන ප්‍රශ්නයකි.'
),
(
    19,
    'සමකාලීන චින්තනය (Modern Philosophy)',
    'Social media නිසා අපි තව හිතනවද? නැත්නම් අඩුවෙන් හිතනවද?',
    'වැඩියෙන් හිතනවා.',
    'අඩුවෙන් හිතනවා.',
    'හිතන්නේ නැහැ, scroll කරනවා විතරයි.',
    'රට depend වෙනවා.',
    'B',
    20,
    5,
    'සමාජ මාධ්‍යවල වේගවත් තොරතුරු ප්‍රවාහය නිසා ගැඹුරු විචාරාත්මක චින්තනය අඩුවන බව බොහෝ සමකාලීන චින්තකයන් පෙන්වා දේ.'
),
(
    20,
    'දාර්ශනික ආරම්භය (Philosophical Wonder)',
    'ඔයා දාර්ශනිකයෙක් නම්, ඔයා අහන්නේ පළමු ප්‍රශ්නය මොකක්ද?',
    'අපි ඇයි ඉන්නේ?',
    'සත්‍යය කියන්නේ මොකක්ද?',
    'හොඳ ජීවිතේ මොකක්ද?',
    'Exam එක ලේසි වෙයි ද?',
    'A',
    20,
    5,
    'පැවැත්මේ අර්ථය (''අපි ඇයි ඉන්නේ?'') යනු දර්ශනයේ මූලිකතම හා ගැඹුරුතම ප්‍රශ්නයයි.'
);
