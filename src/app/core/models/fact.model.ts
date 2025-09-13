export enum Operation {
  Multiplication = 'multiplication',
  Addition = 'addition',
  Subtraction = 'subtraction',
}

export type PracticeMode = 'tables' | 'single-digit';

export interface ProblemStats {
  correct: number;
  wrong: number;
  gotMinFirstCorrect: boolean;
  gotMaxFirstCorrect: boolean;
  requiresTyping: boolean;
  lastSeenUtc?: string;
  attempts: number;
}

export interface LifetimeStats {
  total: number;
  correct: number;
}

export interface User {
  id: string;
  name: string;
  lifetimeStats: LifetimeStats;
  problemHistory: Record<string, ProblemStats>;
}

export interface AppState {
  version: number;
  selectedNumbers: number[];
  mode: PracticeMode;
  useCustomKeypad?: boolean;
  users: User[];
  currentUserId?: string;
}

export interface Question {
  a: number;
  b: number;
  product: number;       // answer
  mode: 'mc' | 'typed';
  options?: number[];
  key: string;
  orientation: 'min-first' | 'max-first';
  operation: Operation;
  placeholder?: string;
}