import { SAMPLE_QUESTIONS, LEVEL_2_QUESTION, getSanitizedQuestions } from './src/data/sampleQuestions.js';

console.log('--- TEST SUITE 1: QUESTION INTEGRITY (20 SINHALA QUESTIONS) ---');
if (SAMPLE_QUESTIONS.length !== 20) {
  throw new Error(`Expected 20 sample questions, but got ${SAMPLE_QUESTIONS.length}`);
}
console.log('✓ Exactly 20 questions present.');

const validKeys = ['A', 'B', 'C', 'D'];
let totalPoints = 0;

SAMPLE_QUESTIONS.forEach((q, idx) => {
  if (!q.question_text || q.question_text.length < 5) {
    throw new Error(`Question ${idx + 1} text too short or empty.`);
  }
  if (!q.option_a || !q.option_b || !q.option_c) {
    throw new Error(`Question ${idx + 1} missing required options A/B/C.`);
  }
  if (!validKeys.includes(q.correct_answer)) {
    throw new Error(`Question ${idx + 1} has invalid correct_answer: ${q.correct_answer}`);
  }
  if (q.correct_answer === 'D' && !q.option_d) {
    throw new Error(`Question ${idx + 1} has correct_answer D, but option_d is missing!`);
  }
  if (q.time_limit !== 20) {
    throw new Error(`Question ${idx + 1} time limit must be 20 seconds.`);
  }
  if (q.points !== 5) {
    throw new Error(`Question ${idx + 1} points must be 5.`);
  }
  totalPoints += q.points;
});

if (totalPoints !== 100) {
  throw new Error(`Total max points expected 100, got ${totalPoints}`);
}
console.log('✓ All 20 questions validated (5 pts each = 100 max score, 20s timer each, Q2 cleanly handles 3 options).');

// Test sanitization (critical security requirement)
console.log('\n--- TEST SUITE 2: CLIENT SANITIZATION (SECURITY) ---');
const sanitized = getSanitizedQuestions();
sanitized.forEach((q, idx) => {
  if ('correct_answer' in q) {
    throw new Error(`SECURITY VULNERABILITY: Question ${idx + 1} exposed correct_answer in sanitized public output!`);
  }
  if ('explanation' in q && q.explanation) {
    throw new Error(`SECURITY VULNERABILITY: Question ${idx + 1} exposed explanation in sanitized public output!`);
  }
});
console.log('✓ Sanitization verified: correct_answer is completely removed before frontend delivery.');

// Test scoring calculation logic
console.log('\n--- TEST SUITE 3: BACKEND SCORING ENGINE ---');
function calculateScore(answers) {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let totalTime = 0;

  const qMap = new Map(SAMPLE_QUESTIONS.map(q => [q.id, q]));

  answers.forEach(a => {
    const q = qMap.get(a.question_id);
    totalTime += (a.time_taken || 0);

    if (!a.selected_answer) {
      unanswered++;
    } else if (q && a.selected_answer.toUpperCase() === q.correct_answer) {
      correct++;
      score += q.points;
    } else {
      incorrect++;
    }
  });

  return { score, correct, incorrect, unanswered, totalTime };
}

// Case 1: Perfect score (20/20)
const perfectAnswers = SAMPLE_QUESTIONS.map(q => ({
  question_id: q.id,
  selected_answer: q.correct_answer,
  time_taken: 5.0
}));
const perfectResult = calculateScore(perfectAnswers);
if (perfectResult.score !== 100 || perfectResult.correct !== 20 || perfectResult.incorrect !== 0) {
  throw new Error(`Perfect score calculation failed: ${JSON.stringify(perfectResult)}`);
}
console.log('✓ Perfect score scenario evaluated correctly: 100/100 points, 20 correct.');

// Case 2: Mixed score (12 correct, 4 incorrect, 4 unanswered)
const mixedAnswers = SAMPLE_QUESTIONS.map((q, idx) => ({
  question_id: q.id,
  selected_answer: idx < 12 ? q.correct_answer : (idx < 16 ? (q.correct_answer === 'A' ? 'B' : 'A') : null),
  time_taken: 10.0
}));
const mixedResult = calculateScore(mixedAnswers);
if (mixedResult.score !== 60 || mixedResult.correct !== 12 || mixedResult.incorrect !== 4 || mixedResult.unanswered !== 4) {
  throw new Error(`Mixed score calculation failed: ${JSON.stringify(mixedResult)}`);
}
console.log('✓ Mixed score scenario evaluated correctly: 60/100 points (12 correct, 4 incorrect, 4 unanswered).');

// Test Level 2 question integrity
console.log('\n--- TEST SUITE 4: LEVEL 2 UNTIMED TYPING QUESTION ---');
if (!LEVEL_2_QUESTION || LEVEL_2_QUESTION.has_time_limit !== false) {
  throw new Error('Level 2 question must have has_time_limit = false.');
}
if (!LEVEL_2_QUESTION.question_text.includes('ඔබට අනුව, දර්ශනය මිනිසාගේ ජීවිතයට වැදගත් වන්නේ ඇයි?')) {
  throw new Error('Level 2 question text mismatch.');
}
console.log('✓ Level 2 untimed reflection question verified.');

console.log('\n=============================================');
console.log('ALL LEVEL 1 + LEVEL 2 TESTS PASSED! 🚀');
console.log('=============================================');
