import { supabase, isSupabaseConfigured } from './supabase';
import { SAMPLE_QUESTIONS, getSanitizedQuestions } from '../data/sampleQuestions';

// Local storage keys for offline/simulation mode
const STORAGE_SESSIONS = 'philoday_sessions';
const STORAGE_RESULTS = 'philoday_results';
const STORAGE_PARTICIPANTS = 'philoday_participants';
const STORAGE_QUESTIONS = 'philoday_questions_v2';

// Initialize simulation data if needed
function initSimulationStorage() {
  if (!localStorage.getItem(STORAGE_QUESTIONS)) {
    localStorage.setItem(STORAGE_QUESTIONS, JSON.stringify(SAMPLE_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_RESULTS)) {
    // Seed sample leaderboard results for an engaging first view
    const initialSeed = [
      {
        id: 'seed-1',
        rank: 1,
        participant_name: 'Hypatia of Alexandria',
        total_score: 100,
        correct_answers: 10,
        incorrect_answers: 0,
        unanswered_questions: 0,
        completion_time: 48.2,
        completed_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'seed-2',
        rank: 2,
        participant_name: 'Hannah Arendt',
        total_score: 90,
        correct_answers: 9,
        incorrect_answers: 1,
        unanswered_questions: 0,
        completion_time: 54.1,
        completed_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'seed-3',
        rank: 3,
        participant_name: 'Bertrand Russell',
        total_score: 90,
        correct_answers: 9,
        incorrect_answers: 1,
        unanswered_questions: 0,
        completion_time: 61.8,
        completed_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'seed-4',
        rank: 4,
        participant_name: 'Simone de Beauvoir',
        total_score: 80,
        correct_answers: 8,
        incorrect_answers: 2,
        unanswered_questions: 0,
        completion_time: 68.0,
        completed_at: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: 'seed-5',
        rank: 5,
        participant_name: 'Ludwig Wittgenstein',
        total_score: 80,
        correct_answers: 8,
        incorrect_answers: 2,
        unanswered_questions: 0,
        completion_time: 75.4,
        completed_at: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_RESULTS, JSON.stringify(initialSeed));
  }
}

// Ensure simulation data is initialized in browser
if (typeof window !== 'undefined') {
  initSimulationStorage();
}

/**
 * Start a new quiz session for a participant
 */
export async function startQuizSession(firstName, lastName) {
  const sessionToken = `sesh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('start_quiz_session', {
        p_first_name: firstName,
        p_last_name: lastName,
        p_session_token: sessionToken
      });

      if (error) {
        throw new Error(error.message);
      }

      // Fetch the sanitized questions (without correct_answer)
      const { data: questionsData, error: qError } = await supabase.rpc('get_active_quiz_questions');
      if (qError) {
        throw new Error(qError.message);
      }

      return {
        sessionToken,
        participantName: data.participant_name,
        expiresAt: data.expires_at,
        questions: questionsData
      };
    } catch (err) {
      console.warn('Supabase start session failed, falling back to simulated session:', err.message);
      // If error is duplicate attempt, pass it on
      if (err.message.includes('already completed')) {
        throw err;
      }
    }
  }

  // Simulation mode
  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();
  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  
  // Check attempt policy
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

  const totalAllowedMs = activeQuestions.reduce((acc, q) => acc + ((q.time_limit || 20) * 1000), 0) + 60000;

  const sessionObj = {
    sessionToken,
    participantName: `${cleanFirst} ${cleanLast}`,
    firstName: cleanFirst,
    lastName: cleanLast,
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
    expiresAt: sessionObj.expiresAt,
    questions: sanitized
  };
}

/**
 * Submit Level 1 answers & Level 2 open reflection and calculate score server-side
 * @param {string} sessionToken
 * @param {Array<{question_id: string, selected_answer: string, time_taken: number}>} answers
 * @param {string} level2Answer
 */
export async function submitQuizAnswers(sessionToken, answers, level2Answer = '') {
  const cleanLevel2 = (level2Answer || '').trim();

  if (isSupabaseConfigured) {
    try {
      let { data, error } = await supabase.rpc('submit_quiz_answers', {
        p_session_token: sessionToken,
        p_answers: answers,
        p_level2_answer: cleanLevel2 || null
      });

      // Graceful fallback if DB hasn't applied the Level 2 migration yet
      if (error && error.message && error.message.includes('p_level2_answer')) {
        const retry = await supabase.rpc('submit_quiz_answers', {
          p_session_token: sessionToken,
          p_answers: answers
        });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        throw new Error(error.message);
      }

      return {
        ...data,
        level2_answer: data.level2_answer ?? cleanLevel2
      };
    } catch (err) {
      console.warn('Supabase submit failed, falling back to simulated submission:', err.message);
      if (err.message.includes('already been submitted') || err.message.includes('expired')) {
        throw err;
      }
    }
  }

  // Simulated backend evaluation (mimics PostgreSQL stored procedure)
  const storedQuestions = JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
  const qMap = new Map(storedQuestions.map(q => [q.id, q]));

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalTime = 0;

  const activeQuestions = storedQuestions.filter(q => q.is_active !== false);
  const maxPossibleScore = activeQuestions.reduce((acc, q) => acc + (q.points || 5), 0) || 100;

  answers.forEach(ans => {
    const q = qMap.get(ans.question_id);
    const timeSpent = Number(ans.time_taken) || 0;
    totalTime += timeSpent;

    if (!ans.selected_answer) {
      unansweredCount++;
    } else if (q && ans.selected_answer.toUpperCase() === q.correct_answer.toUpperCase()) {
      correctCount++;
      totalScore += (q.points || 5);
    } else {
      incorrectCount++;
    }
  });

  const sessions = JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || '[]');
  const session = sessions.find(s => s.sessionToken === sessionToken) || {
    participantName: 'Philosopher Participant'
  };

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  
  const resultRecord = {
    id: `res_${Date.now()}`,
    session_id: sessionToken,
    participant_name: session.participantName,
    total_score: totalScore,
    max_possible_score: maxPossibleScore,
    correct_answers: correctCount,
    incorrect_answers: incorrectCount,
    unanswered_questions: unansweredCount,
    completion_time: parseFloat(totalTime.toFixed(1)),
    level2_answer: cleanLevel2,
    completed_at: new Date().toISOString()
  };

  // Add and calculate rank
  results.push(resultRecord);
  results.sort((a, b) => b.total_score - a.total_score || a.completion_time - b.completion_time);
  
  // Re-rank
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(results));

  const myRank = results.find(r => r.session_id === sessionToken)?.rank || 1;

  return {
    ...resultRecord,
    rank: myRank
  };
}

/**
 * Fetch leaderboard records
 */
export async function fetchLeaderboard(limit = 10) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase get_leaderboard error:', err);
    }
  }

  // Simulation mode
  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  return results.slice(0, limit);
}

/**
 * Admin Authentication
 */
export async function adminLogin(email, password) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  // Simulation Mode login for testing
  // Default organiser credentials for local testing
  if (email === 'admin@philosophyday.edu' && password === 'Philosophy2026!') {
    const mockUser = {
      id: 'mock-admin-id',
      email: 'admin@philosophyday.edu',
      role: 'organiser',
      name: 'Event Coordinator'
    };
    sessionStorage.setItem('philoday_admin_session', JSON.stringify(mockUser));
    return { user: mockUser };
  } else {
    throw new Error('Invalid credentials. (For testing, use admin@philosophyday.edu / Philosophy2026!)');
  }
}

export async function adminLogout() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  sessionStorage.removeItem('philoday_admin_session');
}

export async function getAdminSession() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) return null;
    return data.session;
  }
  const raw = sessionStorage.getItem('philoday_admin_session');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Fetch Admin Metrics
 */
export async function fetchAdminMetrics() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('admin_get_quiz_metrics');
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase admin metrics error:', err);
    }
  }

  // Simulation metrics
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
    total_participants: totalCompleted + 4, // Including in-progress
    total_completed: totalCompleted,
    highest_score: highestScore,
    average_score: avgScore,
    average_time: avgTime
  };
}

/**
 * Fetch All Participant Results for Admin Table
 */
export async function fetchAdminResults() {
  if (isSupabaseConfigured) {
    try {
      let { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          total_score,
          correct_answers,
          incorrect_answers,
          unanswered_questions,
          completion_time,
          level2_answer,
          created_at,
          participants (
            first_name,
            last_name
          )
        `)
        .order('total_score', { ascending: false });

      if (error && error.message && error.message.includes('level2_answer')) {
        const fallback = await supabase
          .from('quiz_results')
          .select(`
            id,
            total_score,
            correct_answers,
            incorrect_answers,
            unanswered_questions,
            completion_time,
            created_at,
            participants (
              first_name,
              last_name
            )
          `)
          .order('total_score', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data) {
        return data.map((item, index) => ({
          id: item.id,
          rank: index + 1,
          participant_name: `${item.participants?.first_name || ''} ${item.participants?.last_name || ''}`.trim(),
          total_score: item.total_score,
          correct_answers: item.correct_answers,
          incorrect_answers: item.incorrect_answers,
          unanswered_questions: item.unanswered_questions,
          completion_time: item.completion_time,
          level2_answer: item.level2_answer || '',
          completed_at: item.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase admin results error:', err);
    }
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  return results;
}

/**
 * Fetch Questions for Admin Management (Includes correct_answer)
 */
export async function fetchAdminQuestions() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_num', { ascending: true });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetch questions error:', err);
    }
  }

  return JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
}

/**
 * Toggle Question Active Status
 */
export async function toggleQuestionActive(questionId, isActive) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('questions')
      .update({ is_active: isActive })
      .eq('id', questionId);
    if (error) throw error;
  }

  const stored = JSON.parse(localStorage.getItem(STORAGE_QUESTIONS) || '[]');
  const updated = stored.map(q => q.id === questionId ? { ...q, is_active: isActive } : q);
  localStorage.setItem(STORAGE_QUESTIONS, JSON.stringify(updated));
}

/**
 * Reset participant's attempt (Organiser feature for edge cases)
 */
export async function resetParticipantAttempt(participantName, resultId = null) {
  if (isSupabaseConfigured && resultId) {
    const { error } = await supabase
      .from('quiz_results')
      .delete()
      .eq('id', resultId);
    if (error) throw error;
    return;
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
  const filtered = results.filter(
    r => r.participant_name.toLowerCase() !== participantName.toLowerCase()
  );
  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(filtered));
}
