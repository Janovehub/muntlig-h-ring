import { Test, TestSession } from '@/types';

const TESTS_KEY = 'oral_exam_tests';
const SESSION_KEY = 'oral_exam_session';

export const getTests = (): Test[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTest = (test: Test): void => {
  if (typeof window === 'undefined') return;
  const tests = getTests();
  const existingIndex = tests.findIndex(t => t.id === test.id);
  
  if (existingIndex >= 0) {
    tests[existingIndex] = test;
  } else {
    tests.push(test);
  }
  
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
};

export const deleteTest = (testId: string): void => {
  if (typeof window === 'undefined') return;
  const tests = getTests().filter(t => t.id !== testId);
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
};

export const getTestByCode = (code: string): Test | undefined => {
  return getTests().find(t => t.code === code);
};

export const generateCode = (): string => {
  const tests = getTests();
  let code: string;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (tests.some(t => t.code === code));
  return code;
};

export const getSession = (): TestSession | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveSession = (session: TestSession): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
};
