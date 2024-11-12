import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
})
export class ContextMenuComponent {
  @Input() showModeratorPrivileges: boolean;
  @Input() canRename: boolean = true;
  @Input() canDelete: boolean = true;
  @Input() checkBoxesGroup: FormGroup<{}>;
  @Input() isResetButtonEnabled: boolean;
  @Input() topicSettingChosen: boolean = false;
  @Input() channelSettingChosen: boolean = false;
  @Input() MaterialSettingChosen: boolean = false;
  @Input() checkBoxesArray: { label: string; control: FormControl<boolean> }[];
  @Input() resetTo: string;
  @Output() renameClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  @Output() resetButtonClicked = new EventEmitter();
  @Output() viewChannelDashboardClicked = new EventEmitter();
  @Output() viewTopicDashboardClicked = new EventEmitter();
  @Output() viewMaterialDashboardClicked = new EventEmitter();
  @Output() notificationSettingClicked = new EventEmitter<{
    label: string;
    control: FormControl<boolean>;
  }>();

  constructor() {}

  onRenameClicked() {
    this.renameClicked.emit();
  }

  onDeleteClicked() {
    this.deleteClicked.emit();
  }

  onResetButtonClicked() {
    this.resetButtonClicked.emit();
  }

  onSettingsClicked(item: { label: string; control: FormControl<boolean> }) {
    this.notificationSettingClicked.emit(item);
  }
  onViewTopicDashboardClicked(){
    this.viewTopicDashboardClicked.emit();
  }
  onViewChannelDashboardClicked(){
    this.viewChannelDashboardClicked.emit();
  }
  onViewMaterialDashboardClicked(){
    this.viewMaterialDashboardClicked.emit();
  }
}
