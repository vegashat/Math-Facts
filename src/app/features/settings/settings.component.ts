import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { AppState, PracticeMode } from '../../core/models/fact.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatRadioModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  numbers = Array.from({ length: 12 }, (_, i) => i + 1);
  selected = signal<number[]>([]);
  mode = signal<PracticeMode>('tables');
  useCustomKeypad = false;

  constructor(private store: StorageService, private router: Router) {}

  ngOnInit(): void {
    this.selected.set(this.store.getSelectedNumbers());
    this.mode.set(this.store.getMode());
    this.useCustomKeypad = this.store.getUseCustomKeypad();
  }

  toggle(num: number, checked: boolean) {
    const curr = new Set(this.selected());
    checked ? curr.add(num) : curr.delete(num);
    this.selected.set([...curr].sort((a, b) => a - b));
  }

  selectAll() {
    this.selected.set([...this.numbers]);
  }

  clearAll() {
    this.selected.set([]);
  }

  saveKeypadSetting() {
    this.store.setUseCustomKeypad(this.useCustomKeypad);
  }

  save() {
    this.store.setMode(this.mode());
    this.saveKeypadSetting();

    if (this.mode() === 'tables') {
      if (this.selected().length === 0) {
        return; // require at least one number in tables mode
      }
      this.store.setSelectedNumbers(this.selected());
    }
    this.router.navigateByUrl('/quiz');
  }
}