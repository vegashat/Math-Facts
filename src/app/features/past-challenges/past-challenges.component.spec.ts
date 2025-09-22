import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastChallengesComponent } from './past-challenges.component';

describe('PastChallengesComponent', () => {
  let component: PastChallengesComponent;
  let fixture: ComponentFixture<PastChallengesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastChallengesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PastChallengesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
