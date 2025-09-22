import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-past-challenges',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatListModule],
  templateUrl: './past-challenges.component.html',
  styleUrls: ['./past-challenges.component.scss'],
})
export class PastChallengesComponent {
  challenges: any[] = [];

  constructor(private store: StorageService) {}

  ngOnInit() {
    this.challenges = this.store.getChallenges();
  }

  clearAll() {
    this.store.clearChallenges();
    this.challenges = [];
  }
}