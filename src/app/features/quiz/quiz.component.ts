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

type Mode = 'setup' | 'quiz' | 'finished';

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
    }, 15000);

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

  positiveMessages: string[] = [
    // Serious
    "Awesome work! ✅",
    "Great job, keep it up! 🎉",
    "You nailed it! 💯",
    "Correct! You're on fire! 🔥",
    "Brilliant answer! 🌟",

    // Math puns
    "You’re right on the money… and the change too! 💰➕",
    "That answer was integral to your success! 🔢",
    "Correct! You’ve really multiplied your skills! ✖️",
    "You just added another win! ➕🎉",
    "You’ve got the right angle! 📐",
    "You’re as sharp as a protractor! 🪄",
    "You’re really in your prime! 🔑",
    "That answer was off the charts! 📊",
    "You’ve got the power! (Exponentially awesome ⚡️)"
  ];

  encouragementMessages: string[] = [
    // Serious
    "Almost! You'll get it next time. 💪",
    "Keep going, you’re learning with every try! 📘",
    "Don’t worry, mistakes help us grow! 🌱",
    "Close one — you’ve got this! 👍",
    "Shake it off and try again! 🎵",

    // Math puns
    "Don’t worry — mistakes are just functions of learning! 🔄",
    "That one didn’t add up — but the next one will! ➕",
    "You can count on yourself to get it next time! 🔢",
    "No need to feel divided — you’ve got this! ➗❤️",
    "Even the best mathematicians have their minus moments. ➖",
    "It’s just one problem — don’t let it multiply! ✖️🙂",
    "You’re greater than you think! ( > ) 🌟",
    "Stay positive! (like numbers) ➕✨",
    "That one was a fraction tricky — but you’ll solve the whole soon! 🍕",
    "Math is about trying again until it all equals out! ="
  ];

  positiveMessage = "";
  encouragementMessage = "";

  private handleResult(isCorrect: boolean) {
    this.clearTimers();
    const q = this.question();
    if (!q) return;

    this.qs.recordAnswer(q, isCorrect);
    this.sessionTotal.set(this.sessionTotal() + 1);
    if (isCorrect) {
      this.sessionCorrect.set(this.sessionCorrect() + 1);
      this.feedback = 'correct';
      this.positiveMessage = this.randomMessage(this.positiveMessages);
    } else {
      this.feedback = 'wrong';
      this.encouragementMessage = this.randomMessage(this.encouragementMessages);
    }

    if (this.currentIndex() + 1 < this.questions.length) {
      this.currentIndex.set(this.currentIndex() + 1);
      setTimeout(() => this.loadNext(), 1800);
    } else {
      // instead of returning to setup immediately, show finished screen
      this.mode.set('finished');
    }
  }
  private randomMessage(list: string[]): string {
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }
  getImageSize(cols: number, rows: number): number {
    const total = cols * rows;
    if (rows <= 4) return 60;
    if (rows <= 6) return 45;
    if (rows <= 8) return 30;
    return 20; // tiny for big grids
  }
  retry() {
    this.mode.set('setup');
    this.currentIndex.set(0);
    this.sessionCorrect.set(0);
    this.sessionTotal.set(0);
    this.feedback = 'idle';
    this.typedAnswer = '';
  }
}