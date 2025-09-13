import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../core/storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { StatsTableComponent } from '../stats-table/stats-table.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    StatsTableComponent,
  ],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  total = 0;
  correct = 0;
  percent = 0;

  users: { id: string; name: string }[] = [];
  selectedUserId: string | null = null;

  constructor(private store: StorageService) {}

  ngOnInit() {
    this.users = this.store.getAllUsers();
    const current = this.store.getCurrentUser();
    this.selectedUserId = current ? current.id : null;

    if (this.selectedUserId) {
      this.loadStats(this.selectedUserId);
    }
  }

  onUserChange(id: string) {
    this.selectedUserId = id;
    this.loadStats(id);
  }

  loadStats(userId: string) {
    const stats = this.store.getLifetimeStats();
    this.total = stats.total;
    this.correct = stats.correct;
    this.percent =
      this.total === 0 ? 0 : Math.round((100 * this.correct) / this.total);
  }

  reset() {
    if (!this.selectedUserId) return;
    this.store.resetLifetime();
    this.loadStats(this.selectedUserId);
  }
}