export interface Question {
  id: string;
  text: string;
  level?: 'easy' | 'medium' | 'hard';
}

export interface Test {
  id: string;
  code: string;
  name: string;
  subject: string;
  mode: 'flat' | 'level-based';
  shuffle: boolean;
  totalTime: number; // in minutes for entire test
  allowStudentLevelChoice: boolean; // student can choose level before each question
  questions: Question[];
  createdAt: string;
}

export interface TestSession {
  testId: string;
  currentQuestionIndex: number;
  startTime: string;
  questionStartTime: string;
  timeRemaining: number; // in seconds
  showTimer: boolean;
  isComplete: boolean;
  selectedLevel?: 'easy' | 'medium' | 'hard'; // current selected level (if student choice enabled)
  answeredQuestions?: string[]; // array of question IDs that have been answered
}
