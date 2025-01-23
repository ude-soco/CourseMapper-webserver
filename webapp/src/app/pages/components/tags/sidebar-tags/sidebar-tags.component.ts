import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { State } from 'src/app/state/app.state';
import { getCurrentCourse, getSelectedChannel, getSelectedTopic, getTagsForChannel, getTagsForCourse, getTagsForTopic } from '../../../courses/state/course.reducer';
import { Material } from 'src/app/models/Material';
import { Topic } from 'src/app/models/Topic';
import { Course } from 'src/app/models/Course';
import { getCurrentMaterial, getTagsForMaterial } from '../../materials/state/materials.reducer';
import { NavigationEnd, Router } from '@angular/router';
import * as CourseActions from '../../../courses/state/course.actions';

@Component({
  selector: 'app-sidebar-tags',
  templateUrl: './sidebar-tags.component.html',
  styleUrls: ['./sidebar-tags.component.css']
})
export class SidebarTagsComponent {
  selectedCourse: Course;
  selectedTopic: Topic;
  selectedChannel: Channel;
  selectedMaterial: Material;

  tagsForCourse: Tag[];
  tagsForTopic: Tag[];
  tagsForChannel: Tag[];
  tagsForMaterial: Tag[];

  constructor(private store: Store<State>, private router: Router){
    this.store.select(getCurrentCourse).subscribe((currentCourse) => this.selectedCourse = currentCourse);
    this.store.select(getSelectedTopic).subscribe((currentTopic) => this.selectedTopic = currentTopic);
    this.store.select(getSelectedChannel).subscribe((currentChannel) => this.selectedChannel = currentChannel);

    this.store.select(getTagsForCourse).subscribe((tags) => this.tagsForCourse = tags);
    this.store.select(getTagsForTopic).subscribe((tags) => this.tagsForTopic = tags);
    this.store.select(getTagsForChannel).subscribe((tags) => this.tagsForChannel = tags);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        if (url.includes('material')){
          this.store.select(getCurrentMaterial).subscribe((currentMaterial) => this.selectedMaterial = currentMaterial);
          this.store.select(getTagsForMaterial).subscribe((tags) => this.tagsForMaterial = tags);
        }
      }
    });

    const url = this.router.url;
    if (url.includes('material')){
      this.store.select(getCurrentMaterial).subscribe((currentMaterial) => this.selectedMaterial = currentMaterial);
      this.store.select(getTagsForMaterial).subscribe((tags) => this.tagsForMaterial = tags);
    }

  }

  navigateToTagPage(tag: Tag){
    this.store.dispatch(CourseActions.loadAnnotationsForSelectedTag({tagSelected: true, selectedTagName: tag.name, courseId: this.selectedCourse._id}));
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
  }
}
