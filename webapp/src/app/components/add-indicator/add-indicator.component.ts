import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { parse } from 'angular-html-parser';
import { MessageService } from 'primeng/api';
import { ShowInfoError } from 'src/app/_helpers/show-info-error';
import { Indicator } from 'src/app/models/Indicator';
import { IndicatorService } from 'src/app/services/indicator.service';
import { IFrameValidators } from 'src/app/validators/iframe.validators';


@Component({
  selector: 'app-add-indicator',
  templateUrl: './add-indicator.component.html',
  styleUrls: ['./add-indicator.component.css'],
  providers: [MessageService],

})
export class AddIndicatorComponent implements OnInit {
 
  @Input() displayAddIndicatorDialogue: boolean = false;
  @Input() forPersonalDashboard: boolean = false;
  @Input() forCourseDashboard: boolean = false;
  @Input() forMaterialDashboard: boolean = false;
  @Input() forChannelDashboard: boolean = false;
  @Input() forTopicDashboard: boolean = false;
  @Input()  materialId: string = "";
  @Input() channelId: string = "";
  @Input() topicId: string = "";
  @Input() courseId: string = "";
  
  @Output() onCloseAddIndicatorDialogue = new EventEmitter<boolean>();
  showInfoError:  ShowInfoError;


 
   

  indicatorForm?: FormGroup = new FormGroup({
    indicatorIframe: new FormControl(null),
  });

  constructor(
    private store: Store<{indicators: {indicators2: Indicator[]}}>,
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private indicatorService: IndicatorService,
  ){

  }

  ngOnInit(): void {

    /* this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });
    console.log(this.materialId) */

    this.indicatorForm = this.formBuilder.group({
      indicatorIframe: [
        null,
        [
          Validators.required,
          IFrameValidators.notOnlyWhitespace,
          Validators.pattern(/^<iframe src='https?:\/\/localhost:8090\/iview\/indicator\?triadID=[a-fA-F0-9-]+' frameborder='0'height='(\d+)px' width='(\d+)px' \/>$/),
          IFrameValidators.iframeValidator,
        ],
      ],
    });
  }
  get indicatorIframe() {
    return this.indicatorForm?.get('indicatorIframe');
  }

  toggleAddIndicatorDialogue(){
    this.displayAddIndicatorDialogue = !this.displayAddIndicatorDialogue
    this.onCloseAddIndicatorDialogue.emit(this.displayAddIndicatorDialogue);
    this.deleteLocalData();
  }
  deleteLocalData() {
    this.ngOnInit();
  }

  onSubmit(){
    
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

    if(this.forPersonalDashboard){    
      this.forMaterialDashboard = false
      this.forCourseDashboard = false;
      this.forChannelDashboard = false;
      this.forTopicDashboard = false;
      this.addNewUserIndicator(newIndicator)
    }
    if(this.forCourseDashboard){ 
      this.forMaterialDashboard = false;
      this.forPersonalDashboard = false;
      this.forChannelDashboard = false;
      this.forTopicDashboard = false;
      this.addNewCourseIndicator(newIndicator)
     
    }
    if(this.forMaterialDashboard){
      this.forPersonalDashboard = false
      this.forCourseDashboard = false;
      this.forChannelDashboard = false;
      this.forTopicDashboard = false;
      this.addNewMaterialIndicator(newIndicator);
    }if(this.forChannelDashboard){
      this.forMaterialDashboard = false
      this.forCourseDashboard = false;
      this.forMaterialDashboard = false;
      this.forTopicDashboard = false;
      this.addNewChannelIndicator(newIndicator);
    }if(this.forTopicDashboard){
      this.forMaterialDashboard = false
      this.forCourseDashboard = false;
      this.forMaterialDashboard = false;
      this.forChannelDashboard = false;

      this.addNewTopicIndicator(newIndicator)
    }

  }
  
  addNewUserIndicator(newIndicator: any ){
    this.indicatorService
    .addNewUserIndicator(newIndicator)
    .subscribe((res: any) => {
      if ('success' in res) {
        this.toggleAddIndicatorDialogue();
        this.showInfoError = new ShowInfoError(this.messageService);
        this.showInfoError.showInfo(res.success);
      } else {
        this.showInfoError.showError(res.errorMsg);
      }
    });
  }

  addNewCourseIndicator(newIndicator: any){
    this.indicatorService
      .addNewIndicator(newIndicator)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.toggleAddIndicatorDialogue();
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });

  }
  addNewMaterialIndicator( indicator){
    this.indicatorService.addNewMaterialIndicator(this.materialId, indicator)
    .subscribe((res: any) => {
      if ('success' in res) {
        this.toggleAddIndicatorDialogue();
        this.showInfoError = new ShowInfoError(this.messageService);
        this.showInfoError.showInfo(res.success);
      } else {
        this.showInfoError.showError(res.errorMsg);
      }
    });

  }

  addNewChannelIndicator(indicator){
    this.indicatorService.addNewChannelIndicator(this.channelId, indicator)
    .subscribe((res: any) => {
      if ('success' in res) {
        this.toggleAddIndicatorDialogue();
        this.showInfoError = new ShowInfoError(this.messageService);
        this.showInfoError.showInfo(res.success);
      } else {
        this.showInfoError.showError(res.errorMsg);
      }
    });

  }

  addNewTopicIndicator(indicator){
    this.indicatorService.addNewTopicIndicator( this.topicId, indicator)
    .subscribe((res: any) => {
      if ('success' in res) {
        this.toggleAddIndicatorDialogue();
        this.showInfoError = new ShowInfoError(this.messageService);
        this.showInfoError.showInfo(res.success);
      } else {
        this.showInfoError.showError(res.errorMsg);
      }
    });

  }


}
