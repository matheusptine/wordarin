import { useState, useCallback } from 'react';

const todayKey = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

function storageKey(feature) {
  return `wordarin-limit-${feature}`;
}

function readRecord(feature) {
  try {
    const raw = localStorage.getItem(storageKey(feature));
    if (!raw) return { date: '', count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function writeRecord(feature, record) {
  localStorage.setItem(storageKey(feature), JSON.stringify(record));
}

/**
 * Track daily usage for a feature. Resets automatically at midnight.
 * @param {string} feature  e.g. 'flashcards' | 'fill-blanks'
 * @param {object} options
 * @param {number} options.limit  Max uses per day for free users
 * @param {boolean} options.isLoggedIn  If true, limit is ignored
 */
export function useDailyLimit(feature, { limit, isLoggedIn }) {
  const [record, setRecord] = useState(() => readRecord(feature));

  const count = record.count;
  const exceeded = !isLoggedIn && count >= limit;
  const remaining = isLoggedIn ? Infinity : Math.max(0, limit - count);

  const increment = useCallback(() => {
    if (isLoggedIn) return;
    setRecord(prev => {
      const today = todayKey();
      const base = prev.date === today ? prev : { date: today, count: 0 };
      const next = { ...base, count: base.count + 1 };
      writeRecord(feature, next);
      return next;
    });
  }, [feature, isLoggedIn]);

  return { count, remaining, exceeded, increment };
}
