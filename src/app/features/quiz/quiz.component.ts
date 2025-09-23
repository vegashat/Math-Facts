import {
  Component,
  OnInit,
  HostBinding,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../../core/question.service';
import { Question, Operation } from '../../core/models/fact.model';
import { StorageService } from '../../core/storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type Mode = 'setup' | 'quiz';

@Component({
  selector: 'app-quiz',
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
    RouterLink,
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizComponent implements OnInit {
  @ViewChild('answerInput') answerInput!: ElementRef<HTMLInputElement>;

  // quiz state
  mode = signal<Mode>('setup');
  question = signal<Question | null>(null);
  questions: Question[] = [];
  currentIndex = signal(0);

  // setup options
  selectedTables: number[] = [];
  totalQuestions = 12;
  quizMode: 'mc' | 'typed' = 'mc';
  repeatIncorrect = false;

  // session tracking
  sessionTotal = signal(0);
  sessionCorrect = signal(0);
  typedAnswer: string = '';
  feedback: 'idle' | 'correct' | 'wrong' = 'idle';
  useCustomKeypad = true;

  showAnswer = signal(false);
  flashing = signal(false);
  autoRevealCorrect: number | null = null;

  private revealTimer: any;
  private flashTimer: any;

  @HostBinding('class') get feedbackClass() {
    return this.feedback;
  }

  operation: Operation = Operation.Multiplication;
  Operation = Operation; //enum import

  percent = computed(() =>
    this.sessionTotal() === 0
      ? 0
      : Math.round((100 * this.sessionCorrect()) / this.sessionTotal())
  );
  quizStyle: 'random' | 'sequential' = 'random';
  reverseOrder = false;


  constructor(private qs: QuestionService, private store: StorageService) { }

  ngOnInit(): void {
    this.useCustomKeypad = this.store.getUseCustomKeypad();
  }

  toggleTable(n: number) {
    if (this.selectedTables.includes(n)) {
      this.selectedTables = this.selectedTables.filter((x) => x !== n);
    } else if (this.selectedTables.length < 11) {
      this.selectedTables = [...this.selectedTables, n];
    }
    this.totalQuestions = this.selectedTables.length * 12;
  }

  startQuiz() {
    if (this.quizStyle === 'sequential') {
      this.questions = this.qs.generateSequentialQuiz(
        this.selectedTables,
        this.totalQuestions,
        this.quizMode,
        this.operation,
        this.reverseOrder
      );
    } else {
      this.questions = this.qs.generateQuiz(
        this.selectedTables,
        this.totalQuestions,
        this.quizMode,
        this.repeatIncorrect,
        this.operation
      );
    }

    this.currentIndex.set(0);
    this.sessionCorrect.set(0);
    this.typedAnswer = '';
    this.feedback = 'idle';
    this.mode.set('quiz');



    this.loadNext();
  }

  private clearTimers() {
    clearTimeout(this.revealTimer);
    clearTimeout(this.flashTimer);
  }

  private loadNext() {
    this.feedback = 'idle';
    this.typedAnswer = '';
    this.showAnswer.set(false);
    this.flashing.set(false);
    this.autoRevealCorrect = null;
    this.clearTimers();

    const q = this.questions[this.currentIndex()] ?? null;
    this.question.set(q);

    if (!q) return;

    // schedule answer reveal after 5s
    this.revealTimer = setTimeout(() => {
      if (q.mode === 'typed') {
        this.flashing.set(true);
        this.flashTimer = setTimeout(() => {
          this.flashing.set(false);
          this.showAnswer.set(true);
        }, 2000);
      } else if (q.mode === 'mc') {
        this.autoRevealCorrect = q.product;
        this.flashTimer = setTimeout(() => {
          this.autoRevealCorrect = null;
        }, 2000);
      }
    }, 5000);

    setTimeout(() => {
      if (q.mode === 'typed' && this.answerInput && !this.useCustomKeypad) {
        this.answerInput.nativeElement.focus();
        this.answerInput.nativeElement.select();
      }
    });
  }

  pickOption(val: number) {
    const q = this.question();
    if (!q) return;
    const isCorrect = val === q.product;
    this.handleResult(isCorrect);
  }

  onTypedInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.typedAnswer = (input.value);
  }

  submitTyped() {
    const q = this.question();
    if (!q) return;
    const num = Number(this.typedAnswer);
    const isCorrect = !Number.isNaN(num) && num === q.product;
    this.handleResult(isCorrect);
  }

  appendDigit(n: number) {
    this.typedAnswer = (this.typedAnswer + n.toString());
  }

  backspace() {
    this.typedAnswer = (this.typedAnswer.slice(0, -1));
  }

  private handleResult(isCorrect: boolean) {
    this.clearTimers(); // cancel reveal if answered early
    const q = this.question();
    if (!q) return;

    this.qs.recordAnswer(q, isCorrect);
    this.sessionTotal.set(this.sessionTotal() + 1);
    if (isCorrect) this.sessionCorrect.set(this.sessionCorrect() + 1);

    this.feedback = isCorrect ? 'correct' : 'wrong';

    if (this.currentIndex() + 1 < this.questions.length) {
      this.currentIndex.set(this.currentIndex() + 1);
      setTimeout(() => this.loadNext(), 450);
    } else {
      this.mode.set('setup'); // end returns to setup for practice
    }
  }
}