import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-stats-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-table.component.html',
  styleUrls: ['./stats-table.component.scss'],
})
export class StatsTableComponent implements OnChanges {
  @Input() userId!: string;

  mode: 'tables' | 'single-digit' = 'tables';
  rows: number[] = [];
  cols: number[] = [];
  history: Record<string, any> = {};

  constructor(private store: StorageService) {}

  ngOnChanges() {
    this.history = this.store.getProblemHistory();
    this.setMode(this.store.getMode());
  }

  setMode(mode: 'tables' | 'single-digit') {
    this.mode = mode;
    if (this.mode === 'tables') {
      this.rows = Array.from({ length: 12 }, (_, i) => i + 1);
      this.cols = Array.from({ length: 12 }, (_, i) => i + 1);
    } else {
      this.rows = Array.from({ length: 9 }, (_, i) => i + 1);
      this.cols = Array.from({ length: 9 }, (_, i) => i + 1);
    }
  }

  getStats(a: number, b: number): { percent: number; attempts: number } {
    let ops: string[];

    if (this.mode === 'tables') {
      ops = ['multiplication'];
    } else {
      ops = ['addition', 'subtraction'];
    }

    let total = 0;
    let correct = 0;
    for (const op of ops) {
      const key = `${a}-${op}-${b}`;
      const entry = this.history[key];
      if (entry) {
        total += entry.correct + entry.wrong;
        correct += entry.correct;
      }
    }

    const percent = total > 0 ? Math.round((100 * correct) / total) : 0;
    return { percent, attempts: total };
  }

  getColorClass(percent: number): string {
    if (percent === 0) return 'no-data';
    if (percent >= 80) return 'good';
    if (percent >= 50) return 'ok';
    return 'bad';
  }
}