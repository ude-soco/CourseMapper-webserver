import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Annotation } from 'src/app/models/Annotations';
import { State } from 'src/app/state/app.reducer';
import { getAnnotationsForSelectedTag } from '../state/course.reducer';

@Component({
  selector: 'app-tags-page',
  templateUrl: './tags-page.component.html',
  styleUrls: ['./tags-page.component.css']
})
export class TagsPageComponent {
  annotationsForTag: Annotation[];

  constructor(private store: Store<State>){
    this.store.select(getAnnotationsForSelectedTag).subscribe((annotations) => this.annotationsForTag = annotations);
  }

}
