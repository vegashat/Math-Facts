import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { StorageService } from './core/storage.service';
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, CommonModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  userName: string | null = null;

  constructor(private store: StorageService, private router: Router) { }

  ngOnInit(): void {
    const user = this.store.getCurrentUser();
    if (!user) {
      this.router.navigateByUrl('/users');
    } else {
      this.userName = user.name;
    }
  }
}