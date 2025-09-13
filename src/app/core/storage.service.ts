import { Injectable } from '@angular/core';
import { AppState, PracticeMode, ProblemStats, User, LifetimeStats } from './models/fact.model';

const STORAGE_KEY = 'math-facts-state';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private state: AppState;

  constructor() {
    this.state = this.loadState();
    // Ensure at least one user exists
    if (!this.state.users || this.state.users.length === 0) {
      const defaultUser: User = {
        id: this.uuid(),
        name: 'Player 1',
        lifetimeStats: { total: 0, correct: 0 },
        problemHistory: {},
      };
      this.state.users = [defaultUser];
      this.state.currentUserId = defaultUser.id;
      this.saveState();
    }
  }

  // ---------------------------
  // Persistence
  // ---------------------------
  private loadState(): AppState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as AppState;
      } catch {
        console.warn('Bad local storage state, resetting.');
      }
    }
    return {
      version: 1,
      selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mode: 'tables',
      users: [],
      useCustomKeypad: false,
    };
  }

  private saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private uuid(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // ---------------------------
  // Mode & numbers
  // ---------------------------
  public setMode(mode: PracticeMode) {
    this.state.mode = mode;
    this.saveState();
  }

  public getMode(): PracticeMode {
    return this.state.mode;
  }

  public setSelectedNumbers(nums: number[]) {
    this.state.selectedNumbers = nums;
    this.saveState();
  }

  public getSelectedNumbers(): number[] {
    return this.state.selectedNumbers;
  }

  // ---------------------------
  // Users
  // ---------------------------
  public getAllUsers(): User[] {
    return this.state.users;
  }

  public getCurrentUser(): User | null {
    return this.state.users.find(u => u.id === this.state.currentUserId) || null;
  }

  public switchUser(id: string, name?: string) {
    let user = this.state.users.find(u => u.id === id);
    if (!user) {
      user = {
        id,
        name: name || `Player ${this.state.users.length + 1}`,
        lifetimeStats: { total: 0, correct: 0 },
        problemHistory: {},
      };
      this.state.users.push(user);
    } else if (name) {
      user.name = name;
    }
    this.state.currentUserId = user.id;
    this.saveState();
  }

  public deleteUser(id: string) {
    this.state.users = this.state.users.filter(u => u.id !== id);
    if (this.state.currentUserId === id) {
      this.state.currentUserId = this.state.users[0]?.id;
    }
    this.saveState();
  }

  // ---------------------------
  // Stats (per-user)
  // ---------------------------
  private currentOrThrow(): User {
    const u = this.getCurrentUser();
    if (!u) throw new Error('No current user');
    return u;
  }

  public getProblemStats(key: string): ProblemStats {
    const user = this.currentOrThrow();
    if (!user.problemHistory[key]) {
      user.problemHistory[key] = {
        correct: 0,
        wrong: 0,
        gotMinFirstCorrect: false,
        gotMaxFirstCorrect: false,
        requiresTyping: false,
        attempts: 0,
      };
    }
    return user.problemHistory[key];
  }

  public saveProblemStats(key: string, updater: () => ProblemStats) {
    const user = this.currentOrThrow();
    user.problemHistory[key] = updater();
    this.saveState();
  }

  public getProblemHistory(): Record<string, ProblemStats> {
    return this.currentOrThrow().problemHistory;
  }

  public getLifetimeStats(): LifetimeStats {
    return this.currentOrThrow().lifetimeStats;
  }

  public updateLifetimeStats(delta: { total: number; correct: number }) {
    const stats = this.currentOrThrow().lifetimeStats;
    stats.total += delta.total;
    stats.correct += delta.correct;
    this.saveState();
  }

  public resetLifetime() {
    const user = this.currentOrThrow();
    user.lifetimeStats = { total: 0, correct: 0 };
    this.saveState();
  }
  // ---------------------------
  // Settings
  // ---------------------------
  public getUseCustomKeypad(): boolean {
    return this.state.useCustomKeypad ?? false;
  }

  public setUseCustomKeypad(val: boolean) {
    this.state.useCustomKeypad = val;
    this.saveState();
  }
}