import dayjs from 'dayjs';
import { count, fromDbJson, many, one } from '../lib/db.js';

type TopicScoreMap = Record<string, number>;

export async function getStudentAnalytics(userId: string) {
  const progressRows = many<Record<string, unknown>>('SELECT * FROM lesson_progress WHERE user_id = ?', userId);
  const attemptRows = many<Record<string, unknown>>('SELECT * FROM quiz_attempts WHERE user_id = ?', userId);
  const mistakeRows = many<Record<string, unknown>>('SELECT * FROM mistakes WHERE user_id = ?', userId);
  const labSubmissionCount = count('SELECT COUNT(*) as value FROM lab_submissions WHERE user_id = ?', userId);
  const totalLessons = count('SELECT COUNT(*) as value FROM lessons');

  const totalCompleted = progressRows.filter((entry) => Number(entry.completed) === 1).length;
  const completionRate = totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const totalQuizAccuracy = attemptRows.length
    ? Math.round((attemptRows.reduce((sum, attempt) => sum + Number(attempt.accuracy), 0) / attemptRows.length) * 100)
    : 0;

  const timeStudied = progressRows.reduce((sum, row) => sum + Number(row.time_spent_minutes ?? 0), 0)
    + attemptRows.reduce((sum, row) => sum + Number(row.time_spent_minutes ?? 0), 0);

  const mistakesByTopic = mistakeRows.reduce<Record<string, number>>((acc, row) => {
    const topic = String(row.topic);
    acc[topic] = (acc[topic] || 0) + Number(row.repeat_count ?? 0);
    return acc;
  }, {});

  const weakTopics = Object.entries(mistakesByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, misses]) => ({ topic, misses }));

  const quizByTopic = attemptRows.reduce<Record<string, { total: number; score: number }>>((acc, row) => {
    const details = fromDbJson<{ topicScores?: TopicScoreMap }>(row.details, {});
    Object.entries(details.topicScores || {}).forEach(([topic, score]) => {
      if (!acc[topic]) acc[topic] = { total: 0, score: 0 };
      acc[topic].total += 1;
      acc[topic].score += Number(score);
    });
    return acc;
  }, {});

  const topicAccuracy = Object.entries(quizByTopic).map(([topic, item]) => ({
    topic,
    accuracy: Math.round(item.score / Math.max(item.total, 1))
  }));

  const lessonPhaseRows = many<Record<string, unknown>>('SELECT phase_title FROM lessons');
  const phaseLabels = ['Foundations', 'Technical Core', 'Security Fundamentals and Blue Team', 'Web, AppSec, and Cloud', 'Professionalization'];

  const skillRadar = phaseLabels.map((label) => {
    const relatedTopics = topicAccuracy.filter((item) => item.topic.toLowerCase().includes(label.toLowerCase().split(',')[0].split(' ')[0].toLowerCase()));
    const phaseCount = lessonPhaseRows.filter((row) => String(row.phase_title) === label).length;
    const value = relatedTopics.length
      ? Math.round(relatedTopics.reduce((sum, item) => sum + item.accuracy, 0) / relatedTopics.length)
      : phaseCount ? 45 : 0;
    return { skill: label, value };
  });

  const activity = progressRows
    .filter((entry) => entry.completed_at)
    .map((entry) => dayjs(String(entry.completed_at)).format('YYYY-MM-DD'))
    .reduce<Record<string, number>>((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

  const streakDays = computeStreak(Object.keys(activity));

  return {
    totalCompleted,
    completionRate,
    totalQuizAccuracy,
    weakTopics,
    topicAccuracy,
    timeStudied,
    streakDays,
    milestones: [
      { label: 'Foundations started', done: totalCompleted >= 1 },
      { label: 'Five lessons completed', done: totalCompleted >= 5 },
      { label: 'Four labs attempted', done: labSubmissionCount >= 4 },
      { label: 'Specialization readiness', done: completionRate >= 45 && totalQuizAccuracy >= 75 },
      { label: 'Capstone readiness', done: completionRate >= 70 && totalQuizAccuracy >= 80 }
    ],
    readiness: {
      specialization: Math.min(100, Math.round((completionRate * 0.55) + (totalQuizAccuracy * 0.45))),
      capstone: Math.min(100, Math.round((completionRate * 0.65) + (totalQuizAccuracy * 0.35)))
    },
    skillRadar
  };
}

function computeStreak(days: string[]) {
  const sorted = [...new Set(days)].sort();
  if (!sorted.length) return 0;

  let streak = 0;
  let cursor = dayjs().startOf('day');

  while (sorted.includes(cursor.format('YYYY-MM-DD'))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return streak;
}
