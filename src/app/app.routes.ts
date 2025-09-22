import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./features/user-select/user-select/user-select.component')
        .then((m) => m.UserSelectComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component')
        .then((m) => m.SettingsComponent),
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./features/quiz/quiz.component')
        .then((m) => m.QuizComponent),
  },
  {
    path: 'take-quiz',
    loadComponent: () =>
      import('./features/take-quiz/take-quiz.component')
        .then(m => m.TakeQuizComponent),
  },
  {
    path: 'challenges',
    loadComponent: () =>
      import('./features/past-challenges/past-challenges.component')
        .then(m => m.PastChallengesComponent),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/stats/stats.component')
        .then((m) => m.StatsComponent),
  },
  // Default redirect
  { path: '', redirectTo: '/users', pathMatch: 'full' },
  // Fallback
  { path: '**', redirectTo: '/users' },
];