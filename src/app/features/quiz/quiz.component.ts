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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizComponent implements OnInit {
  @ViewChild('answerInput') answerInput!: ElementRef<HTMLInputElement>;
  question = signal<Question | null>(null);
  sessionTotal = signal(0);
  sessionCorrect = signal(0);
  typedAnswer = signal<string>('');
  feedback: 'idle' | 'correct' | 'wrong' = 'idle';
  useCustomKeypad = false;

  @HostBinding('class') get feedbackClass() {
    return this.feedback;
  }

  userName: string | null = null;
  Operation = Operation;

  percent = computed(() =>
    this.sessionTotal() === 0
      ? 0
      : Math.round((100 * this.sessionCorrect()) / this.sessionTotal())
  );

  constructor(private qs: QuestionService, private store: StorageService) {}

  ngOnInit(): void {
    this.loadNext();

    const user = this.store.getCurrentUser();
    this.userName = user ? user.name : null;

    this.useCustomKeypad = this.store.getUseCustomKeypad();
  }

  private loadNext() {
    this.feedback = 'idle';
    this.typedAnswer.set('');
    const q = this.qs.getNextQuestion();
    this.question.set(q);

    setTimeout(() => {
      if (q?.mode === 'typed' && this.answerInput && !this.useCustomKeypad) {
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
    this.typedAnswer.set(input.value);
  }

  submitTyped() {
    const q = this.question();
    if (!q) return;
    const num = Number(this.typedAnswer());
    const isCorrect = !Number.isNaN(num) && num === q.product;
    this.handleResult(isCorrect);
  }

  appendDigit(n: number) {
    this.typedAnswer.set(this.typedAnswer() + n.toString());
  }

  backspace() {
    this.typedAnswer.set(this.typedAnswer().slice(0, -1));
  }

  private handleResult(isCorrect: boolean) {
    const q = this.question();
    if (!q) return;

    this.qs.recordAnswer(q, isCorrect);
    this.sessionTotal.set(this.sessionTotal() + 1);
    if (isCorrect) this.sessionCorrect.set(this.sessionCorrect() + 1);

    this.feedback = isCorrect ? 'correct' : 'wrong';
    setTimeout(() => this.loadNext(), 450);
  }
}