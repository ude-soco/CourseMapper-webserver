import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserKgOrderedService } from 'src/app/services/user-kg-ordered.service';
import { EngagementKgOrderedService } from 'src/app/services/engagement-kg-ordered.service';
import { StorageService } from 'src/app/services/storage.service';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DNUEngagementKgOrderedService } from 'src/app/services/dnu-engagement-kg-ordered.service';

@Component({
  selector: 'app-personal-knowledge-graph',
  templateUrl: './personal-knowledge-graph.component.html',
  styleUrls: ['./personal-knowledge-graph.component.css'],
  providers: [ConfirmationService],
})
export class PersonalKnowledgeGraphComponent implements OnInit {
  isLoggedin: boolean = false;
  showConceptMapEvent: boolean = false;
  loggedInUser: User;

  showUserKg: boolean = true;
  showEngagementKg: boolean = false;
  showDNUEngagementKg: boolean = false;

  @Output() conceptMapEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private storageService: StorageService,
    private userKgService: UserKgOrderedService,
    private store: Store<State>,
    private engagementKgService: EngagementKgOrderedService,
    private dnuengagementKgService: DNUEngagementKgOrderedService
  ) {
    this.isLoggedin = this.storageService.isLoggedIn();
    this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));
  }

  ngOnInit(): void {
    this.userKgService.generateUserKG().subscribe({
      next: (value) => {
        console.log('User KG Event Triggered:', value);
        this.showConceptMapEvent = value;
      },
      error: (err) => console.error('Error receiving KG event:', err),
    });

    if (this.loggedInUser) {
      console.log('set show user kg to true when logged in');
      setTimeout(() => {
        this.userKgService.userKgOrdered(this.loggedInUser);
      }, 100);
    }
  }

  toggleUserKg(event: any) {
    this.showUserKg = event.target.checked;

    if (this.showUserKg && this.showEngagementKg) {
      this.toggleDNUEngagementKg();
      return;
    }

    if (this.showDNUEngagementKg && !this.showUserKg) {
      this.showDNUEngagementKg = false;
      this.showEngagementKg = true;

      this.engagementKgService.generateEngagementKG().subscribe({
        next: (value) => {
          console.log('Engagement KG Event Triggered:', value);
          this.showConceptMapEvent = value;
        },
        error: (err) => console.error('Error receiving KG event:', err),
      });

      if (this.loggedInUser) {
        console.log('showing engagement kg after DNU mode');
        setTimeout(() => {
          this.engagementKgService.engagementKgOrdered(this.loggedInUser);
        }, 100);
      }
      return;
    }

    if (this.showUserKg) {
      this.userKgService.generateUserKG().subscribe({
        next: (value) => {
          console.log('User KG Event Triggered:', value);
          this.showConceptMapEvent = value;
        },
        error: (err) => console.error('Error receiving KG event:', err),
      });

      if (this.loggedInUser) {
        console.log('set show user kg to true when logged in');
        setTimeout(() => {
          this.userKgService.userKgOrdered(this.loggedInUser);
        }, 100);
      }
      this.showEngagementKg = false;
      this.showDNUEngagementKg = false;
    }
  }

  toggleEngagementKg(event: any) {
    this.showEngagementKg = event.target.checked; // set it to true

    if (this.showUserKg && this.showEngagementKg) {
      this.toggleDNUEngagementKg();
      return;
    }

    if (this.showDNUEngagementKg && !this.showEngagementKg) {
      this.showDNUEngagementKg = false;
      this.showUserKg = true;

      this.userKgService.generateUserKG().subscribe({
        next: (value) => {
          console.log('User KG Event Triggered:', value);
          this.showConceptMapEvent = value;
        },
        error: (err) => console.error('Error receiving KG event:', err),
      });

      if (this.loggedInUser) {
        console.log('showing user kg after DNU mode');
        setTimeout(() => {
          this.userKgService.userKgOrdered(this.loggedInUser);
        }, 100);
      }
      return;
    }

    if (this.showEngagementKg) {
      this.engagementKgService.generateEngagementKG().subscribe({
        next: (value) => {
          console.log('Engagement KG Event Triggered:', value);
          this.showConceptMapEvent = value;
        },
        error: (err) => console.error('Error receiving KG event:', err),
      });

      if (this.loggedInUser) {
        console.log('set show engagement kg to true when logged in');
        setTimeout(() => {
          this.engagementKgService.engagementKgOrdered(this.loggedInUser);
        }, 100);
      }
      this.showUserKg = false;
      this.showDNUEngagementKg = false;
    }
  }

  toggleDNUEngagementKg() {
    this.showDNUEngagementKg = true; // set it to true
    if (this.showDNUEngagementKg) {
      this.dnuengagementKgService.generateDNUEngagementKG().subscribe({
        next: (value) => {
          console.log('DNU_Engagement KG Event Triggered:', value);
          this.showConceptMapEvent = value;
        },
        error: (err) => console.error('Error receiving KG event:', err),
      });

      if (this.loggedInUser) {
        console.log('set show dnu engagement kg to true when logged in');
        setTimeout(() => {
          this.dnuengagementKgService.dnuengagementKgOrdered(this.loggedInUser);
        }, 100);
      }
      this.showUserKg = true;
      this.showEngagementKg = true;
    } else {
      this.showUserKg = true;
      this.showEngagementKg = false;
    }
  }
}
