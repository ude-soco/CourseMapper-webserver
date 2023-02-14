import { Component, OnInit } from '@angular/core';
import { Annotation } from 'src/app/models/Annotations';
import { Store } from '@ngrx/store';
import { getInitials } from 'src/app/format';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
@Component({
  selector: 'app-pdf-comment-panel',
  templateUrl: './pdf-comment-panel.component.html',
  styleUrls: ['./pdf-comment-panel.component.css'],
})
export class PdfCommentPanelComponent implements OnInit {
  annotationsWithInitials: Annotation[] = [];

  constructor(private store: Store<State>) {
    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.setInitialsforEachAnnotation(annotations);
    });
  }

  ngOnInit(): void {}

  setInitialsforEachAnnotation(annotations: Annotation[]) {
    this.annotationsWithInitials = annotations.map((annotation) => ({
      ...annotation,
      initials: getInitials(annotation.author.name),
      elapsedTime: this.computeElapsedTime(annotation.createdAt),
    }));
  }

  computeElapsedTime(timestamp: number | undefined): string {
    if (!timestamp) return '';
    let diffMs = new Date().getTime() - new Date(timestamp).getTime(); // milliseconds

    let diffYears = Math.floor(diffMs / 31536000000); // years
    if (diffYears > 0) return diffYears + ' month(s) ago';

    let diffMonths = Math.floor(diffMs / 2721600000); // month
    if (diffMonths > 0) return diffMonths + ' month(s) ago';

    let diffWeeks = Math.floor(diffMs / 604800000); // weeks
    if (diffWeeks > 0) return diffWeeks + ' week(s) ago';

    let diffDays = Math.floor(diffMs / 86400000); // days
    if (diffDays > 0) return diffDays + ' day(s) ago';

    let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
    if (diffHrs > 0) return diffHrs + ' hour(s) ago';

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    if (diffMins > 0) return diffMins + ' minute(s) ago';

    if (diffMs > 0) return 'few seconds ago';

    return '${timestamp}';
  }
}
