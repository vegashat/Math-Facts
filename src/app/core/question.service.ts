import { Injectable } from '@angular/core';
import { Question, Operation } from './models/fact.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  constructor(private store: StorageService) { }

  // Backwards compatible: your component calls this
  getNextQuestion(): Question {
    return this.getQuestion();
  }

  // Main generator (progressive challenge logic)
  getQuestion(): Question {
    const mode = this.store.getMode();
    const selected = this.store.getSelectedNumbers();

    let a = 1, b = 1, op: Operation;

    if (mode === 'tables') {
      // pick base from selected, other 1..12
      const base = selected.length > 0
        ? selected[Math.floor(Math.random() * selected.length)]
        : 1;
      a = base;
      b = Math.floor(Math.random() * 12) + 1;
      op = Operation.Multiplication;
    } else {
      // single-digit addition OR subtraction
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      op = Math.random() < 0.5 ? Operation.Addition : Operation.Subtraction;
      if (op === Operation.Subtraction && b > a) {
        [a, b] = [b, a]; // keep non-negative
      }
    }

    const answer =
      op === Operation.Multiplication ? a * b :
        op === Operation.Addition ? a + b :
          a - b;

    const key = `${a}-${op}-${b}`;
    // ensure stats exist + attempts initialized
    const stats = this.ensureStats(key);
    // bump attempts each time we SHOW a question
    stats.attempts += 1;
    this.store.saveProblemStats(key, () => stats);

    // Decide mode/options by attempts:
    // 1st  -> typed with placeholder
    // 2nd  -> 2 options (correct + way off)
    // 3rd  -> 3 options (correct + close + way off)
    // 4th+ -> typed (no hint)
    let qMode: 'mc' | 'typed';
    let options: number[] | undefined;
    let placeholder: string | undefined;

    switch (stats.attempts) {
      case 1:
        qMode = 'typed';
        placeholder = String(answer);
        break;
      case 2:
        qMode = 'mc';
        options = this.buildTwoOptions(answer);
        break;
      case 3:
        qMode = 'mc';
        options = this.buildThreeOptions(answer);
        break;
      default:
        qMode = 'typed';
        break;
    }

    const orientation: 'min-first' | 'max-first' = a <= b ? 'min-first' : 'max-first';

    return {
      a,
      b,
      operation: op,
      product: answer,
      mode: qMode,
      options,
      placeholder,
      key,
      orientation,
    };
  }

  // Called by your component after the user answers
  recordAnswer(q: Question, isCorrect: boolean) {
    // Update per-problem stats
    const stats = this.ensureStats(q.key);
    if (isCorrect) {
      stats.correct += 1;
    } else {
      stats.wrong += 1;
      // your previous logic was to drop back typing requirements on wrong;
      // the new progressive flow is attempt-based, so no special toggle needed here.
    }
    this.store.saveProblemStats(q.key, () => stats);

    // Update lifetime stats
    this.store.updateLifetimeStats({
      total: 1,
      correct: isCorrect ? 1 : 0,
    });
  }
  // in question.service.ts
  generateQuiz(
    tables: number[],
    count: number,
    mode: 'mc' | 'typed',
    repeatIncorrect: boolean,
    operation: 'multiplication' | 'addition' | 'subtraction' = 'multiplication'
  ): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
      let a: number, b: number, op: Operation;

      if (operation === 'multiplication') {
        if (!tables || tables.length === 0) {
          tables = [1]; // fallback so it always works
        }
        a = tables[Math.floor(Math.random() * tables.length)];
        b = Math.floor(Math.random() * 10) + 1; // 1–10
        op = Operation.Multiplication;

      } else if (operation === 'addition') {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        op = Operation.Addition;

      } else {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        if (b > a) [a, b] = [b, a]; // keep non-negative
        op = Operation.Subtraction;
      }

      const answer =
        op === Operation.Multiplication ? a * b :
          op === Operation.Addition ? a + b :
            a - b;

      questions.push({
        a,
        b,
        operation: op,
        product: answer,
        mode,
        options: mode === 'mc' ? this.buildThreeOptions(answer) : undefined,
        key: `${a}-${op}-${b}`,
        orientation: a <= b ? 'min-first' : 'max-first',
      });
    }

    return questions;
  }
  generateSequentialQuiz(
    tables: number[],
    totalQuestions: number,
    mode: 'mc' | 'typed',
    operation: Operation,
    reverse = false
  ): Question[] {
    const qs: Question[] = [];

    if (operation === Operation.Multiplication) {
      for (const a of tables) {
        for (let b = 1; b <= 12; b++) {
          const first = reverse ? b : a;
          const second = reverse ? a : b;
          qs.push({
            a: first,
            b: second,
            operation,
            product: first * second,
            mode,
            key: `${first}x${second}`,
            orientation: reverse ? 'max-first' : 'min-first',
            options: mode === 'mc' ? this.buildThreeOptions(first * second) : undefined
          });
        }
      }
    }

    if (operation === Operation.Addition || operation === Operation.Subtraction) {
      for (let a = 1; a <= 12; a++) {
        for (let b = 1; b <= 12; b++) {
          let result = operation === Operation.Addition ? a + b : a - b;
          if (result < 0) continue;
          const first = reverse ? b : a;
          const second = reverse ? a : b;
          qs.push({
            a: first,
            b: second,
            operation,
            product: result,
            mode,
            key: `${first}${operation}${second}`,
            orientation: reverse ? 'max-first' : 'min-first',
            options: mode === 'mc' ? this.makeOptions(result) : undefined
          });
        }
      }
    }

    return qs.slice(0, totalQuestions);
  }

  // ---------- helpers ----------
  private makeOptions(answer: number): number[] {
    const opts = new Set<number>();
    opts.add(answer);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 10) - 5;
      const distractor = answer + delta;
      if (distractor >= 0) opts.add(distractor);
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
  }

  private ensureStats(key: string) {
    const s = this.store.getProblemStats(key);
    // initialize attempts if missing (for existing localStorage data)
    if (typeof s.attempts !== 'number') s.attempts = 0;
    return s;
  }

  private buildTwoOptions(answer: number): number[] {
    // way off = +5..+14 or -5..-14 (keep >= 0)
    let wayOff = answer + (Math.floor(Math.random() * 10) + 5) * (Math.random() < 0.5 ? 1 : -1);
    if (wayOff < 0) wayOff = answer + 10;
    return this.shuffle([answer, wayOff]);
  }

  private buildThreeOptions(answer: number): number[] {
    // close = +/- 1..2
    const close = Math.max(0, answer + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)));
    // way off = +5..+14 or -5..-14 (keep >= 0)
    let wayOff = answer + (Math.floor(Math.random() * 10) + 5) * (Math.random() < 0.5 ? 1 : -1);
    if (wayOff < 0) wayOff = answer + 10;
    return this.shuffle([answer, close, wayOff]);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}