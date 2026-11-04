import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rec-score-info',
  templateUrl: './rec-score-info.component.html',
  styleUrls: ['./rec-score-info.component.css']
})
export class RecScoreInfoComponent {
  @Input() raw_rec_score!: number;
  @Input() course_id!: string;

  rec_score_percentage: number = 0;

  ngOnChanges() {
    if (this.raw_rec_score !== undefined) {
      this.rec_score_percentage = this.raw_rec_score * 100;
    }
  }
}
