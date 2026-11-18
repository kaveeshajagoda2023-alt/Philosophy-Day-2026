-- ==============================================================================
-- PHILOSOPHY DAY 2026: ADD PARTICIPANT PHONE NUMBER SUPPORT
-- ==============================================================================

-- 1. Add phone_number column to participants
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Update start_quiz_session to store phone_number
DROP FUNCTION IF EXISTS public.start_quiz_session(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.start_quiz_session(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.start_quiz_session(
    p_first_name TEXT,
    p_last_name TEXT,
    p_session_token TEXT,
    p_phone_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_first TEXT;
    v_clean_last TEXT;
    v_clean_phone TEXT;
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
    v_clean_phone := NULLIF(trim(COALESCE(p_phone_number, '')), '');

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
        WHERE (lower(p.first_name) = lower(v_clean_first) AND lower(p.last_name) = lower(v_clean_last))
           OR (v_clean_phone IS NOT NULL AND p.phone_number = v_clean_phone);

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

    -- +1 hour buffer for untimed Level 2 essay
    v_expires_at := now() + (v_total_seconds + 3600) * INTERVAL '1 second';

    INSERT INTO public.participants (first_name, last_name, phone_number)
    VALUES (v_clean_first, v_clean_last, v_clean_phone)
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
        'phone_number', v_clean_phone,
        'started_at', now(),
        'expires_at', v_expires_at,
        'total_questions', v_total_questions,
        'time_limit_per_question', v_settings.time_limit_per_question
    );
END;
$$;

-- 3. Update admin_get_all_results to include phone_number for Admin Dashboard & CSV
DROP FUNCTION IF EXISTS public.admin_get_all_results(TEXT);

CREATE OR REPLACE FUNCTION public.admin_get_all_results(p_admin_token TEXT)
RETURNS TABLE (
    rank BIGINT,
    result_id UUID,
    session_id UUID,
    participant_name TEXT,
    phone_number TEXT,
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
        p.phone_number,
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
