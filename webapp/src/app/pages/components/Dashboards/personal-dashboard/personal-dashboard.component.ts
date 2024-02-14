import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Indicator } from 'src/app/models/Indicator';
import { parse } from 'angular-html-parser';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { DragulaService } from 'ng2-dragula';
import { IndicatorService } from 'src/app/services/indicator.service';
import { StorageService } from 'src/app/services/storage.service';
import { IFrameValidators } from 'src/app/validators/iframe.validators';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ShowInfoError } from 'src/app/_helpers/show-info-error';

@Component({
  selector: 'app-personal-dashboard',
  templateUrl: './personal-dashboard.component.html',
  styleUrls: ['./personal-dashboard.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class PersonalDashboardComponent implements OnInit {
  loggedInUser: boolean = false;
  indicators: Indicator[] = [];
  private iframeTextarea: ElementRef;
  displayAddIndicatorDialogue: boolean = false;

  forUserDashboard: boolean = true;

  indicator: Indicator;

  focusOnIframeTextarea() {
    if (this.iframeTextarea) this.iframeTextarea.nativeElement.focus();
  }

  constructor(
    private indicatorService: IndicatorService,
    private storageService: StorageService,

    public dragulaService: DragulaService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();
  }

  ngOnInit(): void {
    this.forUserDashboard = true;
    this.focusOnIframeTextarea();
    this.getIndicators();
  }

  getIndicators() {
    this.indicatorService.fetchUserIndicators().subscribe((indicators) => {
      this.indicators = indicators;
    });
    this.indicatorService.onUpdateIndicators$.subscribe(
      (indicators) => (this.indicators = indicators)
    );
  }

  onAddIndicatorDialogueClicked(){
    this.toggleAddIndicatordialogue(true);
  }
  toggleAddIndicatordialogue(visibility){
    this.displayAddIndicatorDialogue = visibility;
  }
}
