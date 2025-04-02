import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { State } from 'src/app/state/app.state';
import {
  getCurrentCourse,
  getSelectedChannel,
  getSelectedTopic,
  getTagsForChannel,
  getTagsForCourse,
  getTagsForTopic,
} from '../../../courses/state/course.reducer';
import { Material } from 'src/app/models/Material';
import { Topic } from 'src/app/models/Topic';
import { Course } from 'src/app/models/Course';
import {
  getCurrentMaterial,
  getTagsForMaterial,
} from '../../materials/state/materials.reducer';
import { NavigationEnd, Router } from '@angular/router';
import * as CourseActions from '../../../courses/state/course.actions';
import { TagService } from 'src/app/services/tag.service';
@Component({
  selector: 'app-sidebar-tags',
  templateUrl: './sidebar-tags.component.html',
  styleUrls: ['./sidebar-tags.component.css'],
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

  visibleTagsTopicsCount = 10; // Number of tags to show initially
  visibleTagsMaterialCount = 10; // Number of tags to show initially
  visibleTagsCourseCount = 10; // Number of tags to show initially
  visibleTagsChannelCount = 10; // Number of tags to show initially


  constructor(
    private store: Store<State>, 
    private router: Router,
    private tagService: TagService){
    this.store
      .select(getCurrentCourse)
      .subscribe((currentCourse) => this.selectedCourse = currentCourse);
    this.store
      .select(getSelectedTopic)
      .subscribe((currentTopic) => this.selectedTopic = currentTopic);
    this.store
      .select(getSelectedChannel)
      .subscribe((currentChannel) => this.selectedChannel = currentChannel);

    this.store
      .select(getTagsForCourse)
      .subscribe((tags) => (this.tagsForCourse = tags));
    this.store
      .select(getTagsForTopic)
      .subscribe((tags) => (this.tagsForTopic = tags));
    this.store
      .select(getTagsForChannel)
      .subscribe((tags) => (this.tagsForChannel = tags));

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        if (url.includes('material')) {
          this.store
            .select(getCurrentMaterial)
            .subscribe(
              (currentMaterial) => (this.selectedMaterial = currentMaterial)
            );
          this.store
            .select(getTagsForMaterial)
            .subscribe((tags) => (this.tagsForMaterial = tags));
        }
      }
    });

    const url = this.router.url;
    if (url.includes('material')) {
      this.store
        .select(getCurrentMaterial)
        .subscribe(
          (currentMaterial) => (this.selectedMaterial = currentMaterial)
        );
      this.store
        .select(getTagsForMaterial)
        .subscribe((tags) => (this.tagsForMaterial = tags));
    }
  }

  navigateToTagPage(tag: Tag) {
    this.store.dispatch(
      CourseActions.loadAnnotationsForSelectedTag({
        tagSelected: true,
        selectedTagName: tag.name,
        courseId: this.selectedCourse._id,
      })
    );
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
  }
  navigateToCourseTagPage(tag: Tag) {
    // Dispatch state update and navigate
    this.store.dispatch(
      CourseActions.loadAnnotationsForSelectedTag({
        tagSelected: true,
        selectedTagName: tag.name,
        courseId: this.selectedCourse._id,
      })
    );
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
    this.tagService
      .logSelectCourseTag(tag, this.selectedCourse._id)
      .subscribe();
  }
  navigateToTopicTagPage(tag: Tag) {
    // Dispatch state update and navigate
    this.store.dispatch(
      CourseActions.loadAnnotationsForSelectedTag({
        tagSelected: true,
        selectedTagName: tag.name,
        courseId: this.selectedCourse._id,
      })
    );
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
    this.tagService.logSelectTopicTag(tag, this.selectedTopic._id).subscribe();
  }
  navigateToChannelTagPage(tag: Tag) {
    // Dispatch state update and navigate
    this.store.dispatch(
      CourseActions.loadAnnotationsForSelectedTag({
        tagSelected: true,
        selectedTagName: tag.name,
        courseId: this.selectedCourse._id,
      })
    );
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
    this.tagService
      .logSelectChannelTag(tag, this.selectedChannel._id)
      .subscribe();
  }
  navigateToMaterialTagPage(tag: Tag) {
    // Dispatch state update and navigate
    this.store.dispatch(
      CourseActions.loadAnnotationsForSelectedTag({
        tagSelected: true,
        selectedTagName: tag.name,
        courseId: this.selectedCourse._id,
      })
    );
    this.router.navigate(['course', this.selectedCourse._id, 'tag', tag.name]);
    this.tagService
      .logSelectMaterialTag(tag, this.selectedMaterial._id)
      .subscribe();
  }

  showMoreTagsCourse(): void {
    // Increase the visible tags by 10, up to the total number of tags
    this.visibleTagsCourseCount = Math.min(this.visibleTagsCourseCount + 10, this.tagsForCourse.length);
  }

  showMoreTagsChannel(): void {
    // Increase the visible tags by 10, up to the total number of tags
    this.visibleTagsChannelCount = Math.min(this.visibleTagsChannelCount + 10, this.tagsForChannel.length);
  }

  showMoreTagsTopic(): void {
    // Increase the visible tags by 10, up to the total number of tags
    this.visibleTagsTopicsCount = Math.min(this.visibleTagsTopicsCount + 10, this.tagsForTopic.length);
  }

  showMoreTagsMaterial(): void {
    // Increase the visible tags by 10, up to the total number of tags
    this.visibleTagsMaterialCount = Math.min(this.visibleTagsMaterialCount + 10, this.tagsForMaterial.length);
  }

  showLessTagsCourse(): void {
    // Decrease the visible tags by 10, down to the initial 10
    this.visibleTagsCourseCount = Math.max(this.visibleTagsCourseCount - 10, 10);
  }

  showLessTagsChannel(): void {
    // Decrease the visible tags by 10, down to the initial 10
    this.visibleTagsChannelCount = Math.max(this.visibleTagsChannelCount - 10, 10);
  }

  showLessTagsTopic(): void {
    // Decrease the visible tags by 10, down to the initial 10
    this.visibleTagsTopicsCount = Math.max(this.visibleTagsTopicsCount - 10, 10);
  }
  ShowLessTagsMaterial(): void {
    // Decrease the visible tags by 10, down to the initial 10
    this.visibleTagsMaterialCount = Math.max(this.visibleTagsMaterialCount - 10, 10);
  }

}
