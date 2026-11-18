-- ==============================================================================
-- PHILOSOPHY DAY 2026: PRIVATE PARTICIPANT RESULTS + FULL ADMIN DETAIL ACCESS
-- 1. Participants can ONLY view their own answered/unanswered counts & Level 2 text (NO scores!)
-- 2. Public leaderboard & direct quiz_results access are LOCKED DOWN
-- 3. Admin login restricted ONLY to kaveeshajagoda2023@gmail.com (bcrypt hashed password)
-- 4. Admin can view ALL participants, scores, every Q1-Q20 selected answer, & Level 2 essay
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. PRIVATE ADMIN TABLES (RLS ENABLED, ZERO PUBLIC ACCESS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Ensure ONLY kaveeshajagoda2023@gmail.com exists as the authorised admin (password hashed via bcrypt)
DELETE FROM public.admin_accounts;
INSERT INTO public.admin_accounts (email, password_hash)
VALUES ('kaveeshajagoda2023@gmail.com', crypt('1234', gen_salt('bf')));

-- ------------------------------------------------------------------------------
-- 2. LOCK DOWN PUBLIC ACCESS TO SCORES & LEADERBOARD
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read quiz results for leaderboard" ON public.quiz_results;
DROP FUNCTION IF EXISTS public.get_leaderboard(INT);

-- Ensure level2_answer column exists
ALTER TABLE public.quiz_results ADD COLUMN IF NOT EXISTS level2_answer TEXT;

-- ------------------------------------------------------------------------------
-- 3. INTERNAL ADMIN TOKEN VERIFIER
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_admin_token(p_admin_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM public.admin_sessions
        WHERE token = p_admin_token
          AND expires_at > now()
    ) INTO v_valid;

    IF NOT v_valid THEN
        RAISE EXCEPTION 'Unauthorized: Please sign in with the authorised organiser account.';
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. UPDATE submit_quiz_answers: NEVER EXPOSE SCORE TO PARTICIPANTS
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.submit_quiz_answers(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.submit_quiz_answers(TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
    p_session_token TEXT,
    p_answers JSONB,
    p_level2_answer TEXT DEFAULT NULL
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
    v_answered_count INT := 0;
    v_total_questions INT := 0;
    v_total_completion_time NUMERIC(6,2) := 0;
    v_item_question_id UUID;
    v_item_selected TEXT;
    v_item_time NUMERIC(5,2);
    v_is_correct BOOLEAN;
    v_result_id UUID;
    v_clean_level2 TEXT;
BEGIN
    v_clean_level2 := NULLIF(trim(COALESCE(p_level2_answer, '')), '');

    SELECT * INTO v_session
    FROM public.quiz_sessions
    WHERE session_token = p_session_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid quiz session token.';
    END IF;

    IF v_session.status = 'completed' THEN
        RAISE EXCEPTION 'This quiz session has already been submitted.';
    END IF;

    IF now() > v_session.expires_at THEN
        UPDATE public.quiz_sessions
        SET status = 'expired'
        WHERE id = v_session.id;
        RAISE EXCEPTION 'Quiz session has expired.';
    END IF;

    SELECT * INTO v_participant FROM public.participants WHERE id = v_session.participant_id;

    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_item_question_id := (v_answer->>'question_id')::UUID;
        v_item_selected := upper(trim(v_answer->>'selected_answer'));
        v_item_time := COALESCE((v_answer->>'time_taken')::NUMERIC, 0);

        v_total_completion_time := v_total_completion_time + v_item_time;

        SELECT * INTO v_question
        FROM public.questions
        WHERE id = v_item_question_id AND is_active = true;

        IF FOUND THEN
            v_total_questions := v_total_questions + 1;

            IF v_item_selected IS NULL OR v_item_selected = '' THEN
                v_is_correct := false;
                v_unanswered_count := v_unanswered_count + 1;
            ELSIF v_item_selected = v_question.correct_answer THEN
                v_is_correct := true;
                v_correct_count := v_correct_count + 1;
                v_answered_count := v_answered_count + 1;
                v_total_score := v_total_score + v_question.points;
            ELSE
                v_is_correct := false;
                v_incorrect_count := v_incorrect_count + 1;
                v_answered_count := v_answered_count + 1;
            END IF;

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

    v_total_completion_time := LEAST(
        v_total_completion_time,
        EXTRACT(EPOCH FROM (now() - v_session.started_at))::NUMERIC(6,2)
    );

    IF v_total_completion_time <= 0 THEN
        v_total_completion_time := EXTRACT(EPOCH FROM (now() - v_session.started_at))::NUMERIC(6,2);
    END IF;

    UPDATE public.quiz_sessions
    SET
        completed_at = now(),
        status = 'completed'
    WHERE id = v_session.id;

    INSERT INTO public.quiz_results (
        participant_id,
        session_id,
        total_score,
        correct_answers,
        incorrect_answers,
        unanswered_questions,
        completion_time,
        level2_answer
    )
    VALUES (
        v_participant.id,
        v_session.id,
        v_total_score,
        v_correct_count,
        v_incorrect_count,
        v_unanswered_count,
        v_total_completion_time,
        v_clean_level2
    )
    RETURNING id INTO v_result_id;

    -- PRIVACY: Return ONLY participant's own answered/unanswered counts & Level 2 essay (NO score!)
    RETURN jsonb_build_object(
        'result_id', v_result_id,
        'participant_name', v_participant.first_name || ' ' || v_participant.last_name,
        'total_questions', v_total_questions,
        'answered_questions', v_answered_count,
        'unanswered_questions', v_unanswered_count,
        'level2_answer', v_clean_level2,
        'completed_at', now()
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. ADMIN AUTHENTICATION & FULL INSPECTION RPCs
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_authenticate(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin RECORD;
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_admin
    FROM public.admin_accounts
    WHERE lower(email) = lower(trim(p_email));

    IF NOT FOUND OR v_admin.password_hash <> crypt(p_password, v_admin.password_hash) THEN
        RAISE EXCEPTION 'Access denied. Invalid organiser email or password.';
    END IF;

    -- Clean up expired tokens
    DELETE FROM public.admin_sessions WHERE expires_at < now();

    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := now() + INTERVAL '8 hours';

    INSERT INTO public.admin_sessions (token, email, expires_at)
    VALUES (v_token, v_admin.email, v_expires_at);

    RETURN jsonb_build_object(
        'token', v_token,
        'email', v_admin.email,
        'expires_at', v_expires_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_logout(p_admin_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.admin_sessions WHERE token = p_admin_token;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_get_quiz_metrics();
CREATE OR REPLACE FUNCTION public.admin_get_quiz_metrics(p_admin_token TEXT)
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
    PERFORM public.verify_admin_token(p_admin_token);

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

CREATE OR REPLACE FUNCTION public.admin_get_all_results(p_admin_token TEXT)
RETURNS TABLE (
    rank BIGINT,
    result_id UUID,
    session_id UUID,
    participant_name TEXT,
    total_score INT,
    correct_answers INT,
    incorrect_answers INT,
    unanswered_questions INT,
    completion_time NUMERIC(6,2),
    level2_answer TEXT,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.verify_admin_token(p_admin_token);

    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (
            ORDER BY qr.total_score DESC, qr.completion_time ASC, qr.created_at ASC
        ) AS rank,
        qr.id AS result_id,
        qr.session_id,
        p.first_name || ' ' || p.last_name AS participant_name,
        qr.total_score,
        qr.correct_answers,
        qr.incorrect_answers,
        qr.unanswered_questions,
        qr.completion_time,
        qr.level2_answer,
        qr.created_at AS completed_at
    FROM public.quiz_results qr
    JOIN public.participants p ON qr.participant_id = p.id
    ORDER BY qr.total_score DESC, qr.completion_time ASC, qr.created_at ASC;
END;
$$;

-- Returns EVERY individual Level 1 question & exact selected answer for a participant
CREATE OR REPLACE FUNCTION public.admin_get_participant_answers(
    p_admin_token TEXT,
    p_session_id UUID
)
RETURNS TABLE (
    order_num INT,
    question_id UUID,
    category TEXT,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    selected_answer VARCHAR(1),
    correct_answer VARCHAR(1),
    is_correct BOOLEAN,
    time_taken NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.verify_admin_token(p_admin_token);

    RETURN QUERY
    SELECT
        q.order_num,
        q.id AS question_id,
        q.category,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        pa.selected_answer,
        q.correct_answer,
        pa.is_correct,
        pa.time_taken
    FROM public.participant_answers pa
    JOIN public.questions q ON pa.question_id = q.id
    WHERE pa.session_id = p_session_id
    ORDER BY q.order_num ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_questions(p_admin_token TEXT)
RETURNS TABLE (
    id UUID,
    order_num INT,
    category TEXT,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(1),
    explanation TEXT,
    time_limit INT,
    points INT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.verify_admin_token(p_admin_token);

    RETURN QUERY
    SELECT
        q.id,
        q.order_num,
        q.category,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.explanation,
        q.time_limit,
        q.points,
        q.is_active
    FROM public.questions q
    ORDER BY q.order_num ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_question(
    p_admin_token TEXT,
    p_question_id UUID,
    p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.verify_admin_token(p_admin_token);

    UPDATE public.questions
    SET is_active = p_is_active
    WHERE id = p_question_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_result(
    p_admin_token TEXT,
    p_result_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    PERFORM public.verify_admin_token(p_admin_token);

    SELECT participant_id INTO v_participant_id
    FROM public.quiz_results
    WHERE id = p_result_id;

    IF v_participant_id IS NOT NULL THEN
        DELETE FROM public.participants WHERE id = v_participant_id;
    ELSE
        DELETE FROM public.quiz_results WHERE id = p_result_id;
    END IF;
END;
$$;
