import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/storage.service';

@Component({
  selector: 'app-user-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './user-select.component.html',
  styleUrls: ['./user-select.component.scss'],
})
export class UserSelectComponent {
  newUserName = '';

  constructor(private store: StorageService, private router: Router) {}

  get users() {
    return this.store.getAllUsers();
  }

  switchUser(id: string) {
    this.store.switchUser(id);
    this.router.navigateByUrl('/quiz');
  }

  addUser() {
    if (!this.newUserName.trim()) return;
    const id = this.newUserName.toLowerCase().replace(/\s+/g, '-');
    this.store.switchUser(id, this.newUserName.trim());
    this.newUserName = '';
    this.router.navigateByUrl('/quiz');
  }

  deleteUser(id: string) {
    this.store.deleteUser(id);
  }
}