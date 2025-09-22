import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { QuestionService } from '../../core/question.service';
import { StorageService } from '../../core/storage.service';
import { Question, Operation } from '../../core/models/fact.model';

type Mode = 'setup' | 'quiz' | 'summary';

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.scss'],
})
export class TakeQuizComponent {
  mode = signal<Mode>('setup');

  selectedTables: number[] = [];
  totalQuestions = 20;
  requiredCorrect = 18;
  reward = '';
  quizMode: 'mc' | 'typed' = 'mc';
  repeatIncorrect = false;

  operation: 'multiplication' | 'addition' | 'subtraction' = 'multiplication';

  questions: Question[] = [];
  currentIndex = signal(0);
  correctCount = signal(0);

  typedAnswer = '';
  feedback: 'idle' | 'correct' | 'wrong' = 'idle';

  answers: (boolean | null)[] = []; // track correct/wrong/null
  useCustomKeypad = true; // default to on for kids

  constructor(private qs: QuestionService, private store: StorageService) { }

  toggleTable(n: number) {
    if (this.selectedTables.includes(n)) {
      this.selectedTables = this.selectedTables.filter((x) => x !== n);
    } else if (this.selectedTables.length < 2) {
      this.selectedTables = [...this.selectedTables, n];
    }
  }

  appendDigit(n: number) {
    this.typedAnswer = this.typedAnswer + n.toString();
  }

  backspace() {
    this.typedAnswer = this.typedAnswer.slice(0, -1);
  }


  startQuiz() {
    if (this.operation === 'multiplication' && this.selectedTables.length === 0) {
      return;
    }

    this.questions = this.qs.generateQuiz(
      this.selectedTables,
      this.totalQuestions,
      this.quizMode,
      this.repeatIncorrect,
      this.operation
    );

    this.answers = Array(this.questions.length).fill(null); // reset
    this.currentIndex.set(0);
    this.correctCount.set(0);
    this.typedAnswer = '';
    this.feedback = 'idle';
    this.mode.set('quiz');
  }

  private handleResult(isCorrect: boolean) {
    const idx = this.currentIndex();
    this.answers[idx] = isCorrect;  // record result ✅

    if (isCorrect) {
      this.correctCount.set(this.correctCount() + 1);
    } else if (this.repeatIncorrect) {
      return; // retry same question
    }

    if (this.currentIndex() + 1 < this.questions.length) {
      this.currentIndex.set(this.currentIndex() + 1);
      this.typedAnswer = '';
      this.feedback = 'idle';
    } else {
      this.finishQuiz();
    }
  }
  get currentQ(): Question | null {
    return this.questions[this.currentIndex()] ?? null;
  }

  pickOption(val: number) {
    const q = this.currentQ;
    if (!q) return;
    const isCorrect = val === q.product;
    this.handleResult(isCorrect);
  }

  submitTyped() {
    const q = this.currentQ;
    if (!q) return;
    const num = Number(this.typedAnswer);
    const isCorrect = !Number.isNaN(num) && num === q.product;
    this.handleResult(isCorrect);
  }

  finishQuiz() {
    const summary = {
      date: new Date().toISOString(),
      tables: this.selectedTables,
      operation: this.operation,
      total: this.totalQuestions,
      required: this.requiredCorrect,
      correct: this.correctCount(),
      reward: this.reward,
      success: this.correctCount() >= this.requiredCorrect,
    };
    this.store.saveChallenge(summary);
    this.mode.set('summary');
  }

  retry() {
    this.mode.set('setup');
  }

  progressPercent = computed(() =>
    Math.min(
      100,
      Math.round((100 * this.correctCount()) / this.requiredCorrect)
    )
  );
}