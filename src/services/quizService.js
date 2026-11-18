import { supabase, isSupabaseConfigured } from './supabase';
import { SAMPLE_QUESTIONS, getSanitizedQuestions } from '../data/sampleQuestions';

// Local storage keys for offline/simulation mode
const STORAGE_SESSIONS = 'philoday_sessions_v3';
const STORAGE_RESULTS = 'philoday_results_v3';
const STORAGE_ANSWERS = 'philoday_answers_v3';
const STORAGE_QUESTIONS = 'philoday_questions_v2';
const ADMIN_SESSION_KEY = 'philoday_admin_session_v2';

// Initialize simulation data if needed
function initSimulationStorage() {
  if (!localStorage.getItem(STORAGE_QUESTIONS)) {
    localStorage.setItem(STORAGE_QUESTIONS, JSON.stringify(SAMPLE_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_RESULTS)) {
    localStorage.setItem(STORAGE_RESULTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_ANSWERS)) {
    localStorage.setItem(STORAGE_ANSWERS, JSON.stringify({}));
  }
}

if (typeof window !== 'undefined') {
  initSimulationStorage();
}

function getStoredAdminToken() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

/**
 * Start a new quiz session for a participant
 */
export async function startQuizSession(firstName, lastName, phoneNumber = '') {
  const sessionToken = `sesh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanPhone = (phoneNumber || '').trim();

  if (isSupabaseConfigured) {
    try {
      let { data, error } = await supabase.rpc('start_quiz_session', {
        p_first_name: firstName,
        p_last_name: lastName,
        p_session_token: sessionToken,
        p_phone_number: cleanPhone || null
      });

      // Graceful fallback if DB hasn't applied the phone_number SQL yet
      if (error && error.message && error.message.includes('p_phone_number')) {
        const retry = await supabase.rpc('start_quiz_session', {
          p_first_name: firstName,
          p_last_name: lastName,
          p_session_token: sessionToken
        });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        throw new Error(error.message);
      }

      const { data: questionsData, error: qError } = await supabase.rpc('get_active_quiz_questions');
      if (qError) {
        throw new Error(qError.message);
      }

      return {
        sessionToken,
        participantName: data.participant_name,
        phoneNumber: cleanPhone,
        expiresAt: data.expires_at,
        questions: questionsData
      };
    } catch (err) {
      if (err.message.includes('already completed') || err.message.includes('paused')) {
        throw err;
      }
      console.warn('Supabase start session failed, falling back to simulated session:', err.message);
    }
  }

  // Simulation mode
  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();
  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');

  const existing = results.find(
    r => r.participant_name.toLowerCase() === `${cleanFirst} ${cleanLast}`.toLowerCase()
  );
  if (existing) {
    const error = new Error(`Participant "${cleanFirst} ${cleanLast}" has already completed this quiz.`);
    error.isAttemptBlocked = true;
    throw error;
  }

  const storedQuestions = JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
  const activeQuestions = storedQuestions.filter(q => q.is_active !== false);
  const sanitized = getSanitizedQuestions(activeQuestions);

  const totalAllowedMs = activeQuestions.reduce((acc, q) => acc + ((q.time_limit || 20) * 1000), 0) + 3600000;

  const sessionObj = {
    sessionToken,
    participantName: `${cleanFirst} ${cleanLast}`,
    firstName: cleanFirst,
    lastName: cleanLast,
    phoneNumber: cleanPhone,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + totalAllowedMs).toISOString(),
    active: true
  };

  const sessions = JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || '[]');
  sessions.push(sessionObj);
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));

  return {
    sessionToken,
    participantName: sessionObj.participantName,
    phoneNumber: cleanPhone,
    expiresAt: sessionObj.expiresAt,
    questions: sanitized
  };
}

/**
 * Submit Level 1 answers & Level 2 open reflection.
 * Returns ONLY participant's own non-score details (answered / unanswered / level2_answer).
 * Score is calculated & stored strictly on the backend for the Admin Dashboard ONLY.
 */
export async function submitQuizAnswers(sessionToken, answers, level2Answer = '') {
  const cleanLevel2 = (level2Answer || '').trim();
  const totalCount = answers.length;
  const answeredCount = answers.filter(a => a.selected_answer && a.selected_answer.trim() !== '').length;
  const unansweredCount = totalCount - answeredCount;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('submit_quiz_answers', {
        p_session_token: sessionToken,
        p_answers: answers,
        p_level2_answer: cleanLevel2 || null
      });

      if (error) {
        throw new Error(error.message);
      }

      // Return ONLY non-score details to the participant UI
      return {
        result_id: data.result_id,
        participant_name: data.participant_name,
        total_questions: data.total_questions ?? totalCount,
        answered_questions: data.answered_questions ?? answeredCount,
        unanswered_questions: data.unanswered_questions ?? unansweredCount,
        level2_answer: data.level2_answer ?? cleanLevel2,
        completed_at: data.completed_at
      };
    } catch (err) {
      if (err.message.includes('already been submitted') || err.message.includes('expired')) {
        throw err;
      }
      console.warn('Supabase submit failed, falling back to simulated submission:', err.message);
    }
  }

  // Simulated backend evaluation (stored privately for Admin only)
  const storedQuestions = JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
  const qMap = new Map(storedQuestions.map(q => [q.id, q]));

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let simUnanswered = 0;
  let totalTime = 0;
  const detailedAnswerRows = [];

  answers.forEach(ans => {
    const q = qMap.get(ans.question_id);
    const timeSpent = Number(ans.time_taken) || 0;
    totalTime += timeSpent;

    let isCorrect = false;
    if (!ans.selected_answer) {
      simUnanswered++;
    } else if (q && ans.selected_answer.toUpperCase() === q.correct_answer.toUpperCase()) {
      isCorrect = true;
      correctCount++;
      totalScore += (q.points || 5);
    } else {
      incorrectCount++;
    }

    if (q) {
      detailedAnswerRows.push({
        order_num: q.order_num,
        question_id: q.id,
        category: q.category,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d || null,
        selected_answer: ans.selected_answer || null,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        time_taken: timeSpent
      });
    }
  });

  const sessions = JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || '[]');
  const session = sessions.find(s => s.sessionToken === sessionToken) || {
    participantName: 'Philosopher Participant'
  };

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  const simAnswered = correctCount + incorrectCount;

  const resultRecord = {
    id: `res_${Date.now()}`,
    session_id: sessionToken,
    participant_name: session.participantName,
    phone_number: session.phoneNumber || '',
    total_score: totalScore,
    correct_answers: correctCount,
    incorrect_answers: incorrectCount,
    answered_questions: simAnswered,
    unanswered_questions: simUnanswered,
    total_questions: answers.length,
    completion_time: parseFloat(totalTime.toFixed(1)),
    level2_answer: cleanLevel2,
    completed_at: new Date().toISOString()
  };

  results.push(resultRecord);
  results.sort((a, b) => b.total_score - a.total_score || a.completion_time - b.completion_time);
  results.forEach((r, idx) => { r.rank = idx + 1; });
  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(results));

  const allAnswersMap = JSON.parse(localStorage.getItem(STORAGE_ANSWERS) || '{}');
  allAnswersMap[sessionToken] = detailedAnswerRows;
  localStorage.setItem(STORAGE_ANSWERS, JSON.stringify(allAnswersMap));

  // Return ONLY participant's own non-score details
  return {
    result_id: resultRecord.id,
    participant_name: resultRecord.participant_name,
    total_questions: resultRecord.total_questions,
    answered_questions: resultRecord.answered_questions,
    unanswered_questions: resultRecord.unanswered_questions,
    level2_answer: resultRecord.level2_answer,
    completed_at: resultRecord.completed_at
  };
}

/**
 * Admin Authentication (ONLY authorised organiser email & password validated on server)
 */
export async function adminLogin(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('admin_authenticate', {
      p_email: cleanEmail,
      p_password: password
    });

    if (error) {
      throw new Error(error.message || 'Invalid organiser email or password.');
    }

    const adminSession = {
      token: data.token,
      email: data.email,
      expiresAt: data.expires_at
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
    return adminSession;
  }

  // Local simulation mode fallback
  if (cleanEmail === 'kaveeshajagoda2023@gmail.com' && password === '1234') {
    const mockSession = {
      token: `local_admin_${Date.now()}`,
      email: cleanEmail,
      role: 'organiser'
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(mockSession));
    return mockSession;
  }

  throw new Error('Access denied. Invalid organiser email or password.');
}

export async function adminLogout() {
  const token = getStoredAdminToken();
  if (isSupabaseConfigured && token) {
    try {
      await supabase.rpc('admin_logout', { p_admin_token: token });
    } catch {
      // Ignore network errors on sign out
    }
  }
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;

    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Fetch Admin Metrics (Admin Only)
 */
export async function fetchAdminMetrics() {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token) {
    const { data, error } = await supabase.rpc('admin_get_quiz_metrics', {
      p_admin_token: token
    });
    if (error) throw new Error(error.message);
    return data;
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  const totalCompleted = results.length;
  const highestScore = results.length ? Math.max(...results.map(r => r.total_score)) : 0;
  const avgScore = results.length
    ? (results.reduce((acc, r) => acc + r.total_score, 0) / results.length).toFixed(1)
    : 0;
  const avgTime = results.length
    ? (results.reduce((acc, r) => acc + r.completion_time, 0) / results.length).toFixed(1)
    : 0;

  return {
    total_participants: totalCompleted,
    total_completed: totalCompleted,
    highest_score: highestScore,
    average_score: avgScore,
    average_time: avgTime
  };
}

/**
 * Fetch All Participant Results for Admin Table (Admin Only)
 */
export async function fetchAdminResults() {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token) {
    const { data, error } = await supabase.rpc('admin_get_all_results', {
      p_admin_token: token
    });
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      id: item.result_id,
      session_id: item.session_id,
      rank: Number(item.rank),
      participant_name: item.participant_name,
      phone_number: item.phone_number || '',
      total_score: item.total_score,
      correct_answers: item.correct_answers,
      incorrect_answers: item.incorrect_answers,
      answered_questions: (item.correct_answers || 0) + (item.incorrect_answers || 0),
      unanswered_questions: item.unanswered_questions,
      completion_time: item.completion_time,
      level2_answer: item.level2_answer || '',
      completed_at: item.completed_at
    }));
  }

  return JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
}

/**
 * Fetch Individual Participant's Detailed Answers (Q1-Q20) (Admin Only)
 */
export async function fetchParticipantAnswers(sessionId) {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token) {
    const { data, error } = await supabase.rpc('admin_get_participant_answers', {
      p_admin_token: token,
      p_session_id: sessionId
    });
    if (error) throw new Error(error.message);
    return data || [];
  }

  const allAnswersMap = JSON.parse(localStorage.getItem(STORAGE_ANSWERS) || '{}');
  return allAnswersMap[sessionId] || [];
}

/**
 * Fetch MCQ Selected Answers for ALL Participants (for Admin Answer Matrix & CSV Export)
 */
export async function fetchAllParticipantAnswers(resultsList = []) {
  const answersBySession = {};
  if (!resultsList || resultsList.length === 0) return answersBySession;

  await Promise.all(
    resultsList.map(async (r) => {
      if (!r.session_id) return;
      try {
        answersBySession[r.session_id] = await fetchParticipantAnswers(r.session_id);
      } catch {
        answersBySession[r.session_id] = [];
      }
    })
  );

  return answersBySession;
}

/**
 * Fetch Questions for Admin Management (Includes correct_answer) (Admin Only)
 */
export async function fetchAdminQuestions() {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token) {
    const { data, error } = await supabase.rpc('admin_get_questions', {
      p_admin_token: token
    });
    if (error) throw new Error(error.message);
    return data || [];
  }

  return JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
}

/**
 * Toggle Question Active Status (Admin Only)
 */
export async function toggleQuestionActive(questionId, isActive) {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token) {
    const { error } = await supabase.rpc('admin_toggle_question', {
      p_admin_token: token,
      p_question_id: questionId,
      p_is_active: isActive
    });
    if (error) throw new Error(error.message);
    return;
  }

  const stored = JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
  const updated = stored.map(q => q.id === questionId ? { ...q, is_active: isActive } : q);
  localStorage.setItem(STORAGE_QUESTIONS, JSON.stringify(updated));
}

/**
 * Reset participant's attempt (Admin Only)
 */
export async function resetParticipantAttempt(participantName, resultId = null) {
  const token = getStoredAdminToken();

  if (isSupabaseConfigured && token && resultId) {
    const { error } = await supabase.rpc('admin_reset_result', {
      p_admin_token: token,
      p_result_id: resultId
    });
    if (error) throw new Error(error.message);
    return;
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  const filtered = results.filter(
    r => r.participant_name.toLowerCase() !== participantName.toLowerCase()
  );
  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(filtered));
}
