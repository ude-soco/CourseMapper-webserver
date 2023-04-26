import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { State } from 'src/app/state/app.state';
import { getSelectedChannel, getTagsForChannel } from '../../courses/state/course.reducer';

@Component({
  selector: 'app-sidebar-tags',
  templateUrl: './sidebar-tags.component.html',
  styleUrls: ['./sidebar-tags.component.css']
})
export class SidebarTagsComponent {
  selectedChannel: Channel;
  tagsForChannel: Tag[];

  constructor(private store: Store<State>){
    this.store.select(getSelectedChannel).subscribe((currentChannel) => this.selectedChannel = currentChannel);
    this.store.select(getTagsForChannel).subscribe((tags) => this.tagsForChannel = tags);
  }
}
