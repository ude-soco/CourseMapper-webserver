import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-profile-name-dialog',
  templateUrl: './profile-name-dialog.component.html',
  styleUrls: ['./profile-name-dialog.component.css']
})
export class ProfileNameDialogComponent implements OnInit {
  profileName: string = '';
  title: string = 'Enter Profile Name';
  placeholder: string = 'Profile name';

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    if (this.config.data) {
      this.title = this.config.data.title || this.title;
      this.profileName = this.config.data.defaultName || '';
      this.placeholder = this.config.data.placeholder || this.placeholder;
    }
  }

  save(): void {
    if (this.profileName.trim()) {
      this.ref.close(this.profileName.trim());
    }
  }

  cancel(): void {
    this.ref.close(null);
  }
}
