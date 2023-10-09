import { Component, ElementRef, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Indicator } from 'src/app/models/Indicator';
import { parse } from 'angular-html-parser';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DragulaService } from 'ng2-dragula';
import { IndicatorService } from 'src/app/services/indicator.service';
import { StorageService } from 'src/app/services/storage.service';
import { IFrameValidators } from 'src/app/validators/iframe.validators';

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

  indicatorForm?: FormGroup = new FormGroup({
    indicatorIframe: new FormControl(''),
  });

  focusOnIframeTextarea() {
    if (this.iframeTextarea) this.iframeTextarea.nativeElement.focus();
  }

  constructor(
    private indicatorService: IndicatorService,
    private storageService: StorageService,
    private messageService: MessageService,
    private dragulaService: DragulaService,
    private formBuilder: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

    this.dragulaService?.createGroup('PERSONALINDICATORS', {
      revertOnSpill: true,
      moves: function (el: any, container: any, handle: any): any {
        if (handle.id === 'dragger') {
          return true;
        }
        return false;
      },
    });

    this.dragulaService?.dropModel('PERSONALINDICATORS').subscribe((args) => {
      this.onReorderIndicators(
        args.sourceIndex,
        args.targetIndex,
      );
    });
  }

  ngOnInit(): void {
    this.focusOnIframeTextarea();
    this.getIndicators();
    this.indicatorForm = this.formBuilder.group({
      indicatorIframe: [
        null,
        [
          Validators.required,
          IFrameValidators.notOnlyWhitespace,
          IFrameValidators.iframeValidator,
        ],
      ],
    });
  }
  get indicatorIframe() {
    return this.indicatorForm?.get('indicatorIframe');
  }

  onReorderIndicators(sourceIndex, targetIndex) {
    this.indicatorService.reorderUserIndicators(sourceIndex, targetIndex)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }

  getIndicators() {
    this.indicatorService.fetchUserIndicators().subscribe((indicators) => {
      this.indicators = indicators;
    });
    this.indicatorService.onUpdateUserIndicators$.subscribe(
      (indicators) => (this.indicators = indicators)
    );
  }

  onAddIndicator() {
    if (this.indicatorForm.invalid) {
      this.indicatorForm.markAllAsTouched();
      return;
    }
    const neededAttributes = ['src', 'width', 'height', 'frameborder'];
    let newIndicator = {};

    const { rootNodes, errors } = parse(this.indicatorIframe.value);
    rootNodes.forEach((node) => {
      if (node['name'] === 'iframe') {
        node['attrs'].forEach((attr) => {
          if (neededAttributes.includes(attr['name'])) {
            newIndicator[attr['name']] = attr['value'];
          }
        });
      }
    });
    this.clearFormInput();
    this.indicatorService
      .addNewUserIndicator(newIndicator)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }

  onDeleteIndicator(indicator) {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to delete the Indicator?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.onConfirmDeletion(indicator)
    });  
  }

  onConfirmDeletion(indicator) {
   console.log(indicator._id)
    this.indicatorService.deleteUserIndicator(indicator._id)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      }); 
  }


  onUpdateIndicator(event: MouseEvent, indicator: Indicator) {}
  clearFormInput() {
    this.indicatorForm.reset();
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  
}
