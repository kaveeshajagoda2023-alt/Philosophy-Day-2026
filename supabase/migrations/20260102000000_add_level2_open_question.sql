-- ==============================================================================
-- PHILOSOPHY DAY 2026: LEVEL 2 OPEN-ENDED TYPING QUESTION MIGRATION
-- Question: "ඔබට අනුව, දර්ශනය මිනිසාගේ ජීවිතයට වැදගත් වන්නේ ඇයි?" (No Time Limit)
-- ==============================================================================

-- 1. Add level2_answer column to quiz_results
ALTER TABLE public.quiz_results
ADD COLUMN IF NOT EXISTS level2_answer TEXT;

-- 2. Extend session expiry in start_quiz_session (+1 hour buffer for untimed Level 2 essay)
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
    v_clean_first := trim(p_first_name);
    v_clean_last := trim(p_last_name);

    IF char_length(v_clean_first) = 0 OR char_length(v_clean_last) = 0 THEN
        RAISE EXCEPTION 'First name and last name are required.';
    END IF;

    SELECT * INTO v_settings FROM public.quiz_settings WHERE id = 1;

    IF NOT v_settings.quiz_is_active THEN
        RAISE EXCEPTION 'The Philosophy Day Quiz is currently paused or concluded.';
    END IF;

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

    SELECT COUNT(*), COALESCE(SUM(time_limit), 400)
    INTO v_total_questions, v_total_seconds
    FROM public.questions
    WHERE is_active = true;

    IF v_total_questions = 0 THEN
        RAISE EXCEPTION 'No active quiz questions found. Please contact event organisers.';
    END IF;

    -- Generous session window (+1 hour) so untimed Level 2 writing never expires
    v_expires_at := now() + (v_total_seconds + 3600) * INTERVAL '1 second';

    INSERT INTO public.participants (first_name, last_name)
    VALUES (v_clean_first, v_clean_last)
    RETURNING id INTO v_participant_id;

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

-- 3. Drop old 2-argument overload and create 3-argument submit_quiz_answers with optional Level 2 text
DROP FUNCTION IF EXISTS public.submit_quiz_answers(TEXT, JSONB);

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
    v_total_completion_time NUMERIC(6,2) := 0;
    v_item_question_id UUID;
    v_item_selected TEXT;
    v_item_time NUMERIC(5,2);
    v_is_correct BOOLEAN;
    v_result_id UUID;
    v_rank INT;
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
        RAISE EXCEPTION 'This quiz session has already been submitted and scored.';
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
        'level2_answer', v_clean_level2,
        'rank', v_rank,
        'completed_at', now()
    );
END;
$$;
