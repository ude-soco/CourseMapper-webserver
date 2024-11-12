import { Component, Input } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { ShowInfoError } from 'src/app/_helpers/show-info-error';
import { Indicator } from 'src/app/models/Indicator';
import { IndicatorService } from 'src/app/services/indicator.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-populate-dashboard',
  templateUrl: './populate-dashboard.component.html',
  styleUrls: ['./populate-dashboard.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class PopulateDashboardComponent {
  @Input() indicators: Indicator[] = [];
  @Input() role: string;
  @Input() selectedCourseId: string;
  @Input() materialId: string;
  @Input() channelId: string;
  @Input() topicId: string;
  @Input() courseId : string;

  indicator: Indicator;
  displayAddIndicatorDialogue: boolean = false;

  showInfoError: ShowInfoError;

  @Input() forCourseDashboard: boolean = false;
  @Input() forPersonalDashboard: boolean = false;
  @Input() forMaterialDashboard: boolean = false;
  @Input() forChannelDashboard: boolean = false;
  @Input() forTopicDashboard: boolean = false;

  moderatorUserOptions: MenuItem[] = [
    {
      label: 'Delete',
      icon: 'pi pi-trash ',
      iconClass: 'red-menu-icon',
      command: () => this.onDeleteIndicator(this.indicator),
    },
  ];


  constructor(
     
    private confirmationService: ConfirmationService,
    private indicatorService: IndicatorService,
    private messageService: MessageService,
    public dragulaService: DragulaService,
    private router: Router,
  ) {
    this.dashboardDragger();
  }
  ngOnInit(): void {


  }

  onAddIndicatorDialogueClicked() {
    this.toggleAddIndicatordialogue(true);
  }
  toggleAddIndicatordialogue(visibility) {
    this.displayAddIndicatorDialogue = visibility;
  }

  onUpdateIndicator(event: MouseEvent, indicator: Indicator) {
    if (event.composedPath()[0]['attributes']['style']) {
      const dimensions =
        event.composedPath()[0]['attributes']['style']['nodeValue'];
      indicator.width = dimensions.slice(7, dimensions.indexOf(';'));
      indicator.height = dimensions.slice(
        dimensions.lastIndexOf(':') + 2,
        dimensions.lastIndexOf(';')
      );
      this.UpdateIdsFromUrl();
      if (this.forPersonalDashboard) {
        this.negateOtherAttributesForPersonal();
        this.updatePersonalIndicator(indicator);
      }
      if (this.forCourseDashboard) {
       this.negateOtherAttributesForCourse();
        this.updateCourseIndicator(indicator);
      }
      if (this.forMaterialDashboard) {
       this.negateOtherAttributesForMaterial();
        this.updateMaterialIndicator(indicator);
      }
      if(this.forChannelDashboard){
        this.negateOtherAttributesForChannel();
        this.updateChannelIndicator(indicator);
      }
      if(this.forTopicDashboard){
        this.negateOtherAttributesForTopic();
        this.updateTopicIndicator(indicator)

      }
    }
  }

 private negateOtherAttributesForPersonal(){
    this.forCourseDashboard = false;
    this.forMaterialDashboard = false;
    this.forChannelDashboard= false;
    this.forTopicDashboard = false;
  }
  private negateOtherAttributesForCourse(){
    this.forPersonalDashboard = false;
    this.forMaterialDashboard = false;
    this.forChannelDashboard= false;
    this.forTopicDashboard = false;
  }
  private negateOtherAttributesForMaterial(){
    this.forPersonalDashboard = false;
    this.forCourseDashboard = false;
    this.forChannelDashboard= false;
    this.forTopicDashboard = false;
  }
  private negateOtherAttributesForChannel(){
    this.forPersonalDashboard = false;
    this.forCourseDashboard = false;
    this.forMaterialDashboard = false;
    this.forTopicDashboard = false;
  }
  private negateOtherAttributesForTopic(){
    this.forPersonalDashboard = false;
    this.forCourseDashboard = false;
    this.forMaterialDashboard = false;
    this.forChannelDashboard = false;
  }

  dashboardDragger() {
    this.dragulaService?.destroy('INDICATORS');
    this.dragulaService?.createGroup('INDICATORS', {
      //removeOnSpill: false,
      //revertOnSpill: true,
      //moves: function (el: any, container: any, handle: any): any {
       // if (handle.id === 'dragger') {
       //   return true;
       // }
      //  return false;
      //},
    });

    this.dragulaService?.dropModel('INDICATORS').subscribe((args) => {

      this.UpdateIdsFromUrl();

      if (this.forPersonalDashboard) {
       this.negateOtherAttributesForPersonal();
        this.onReorderPersonalIndicators(args.sourceIndex, args.targetIndex);
      }
      if (this.forCourseDashboard) {
        this.negateOtherAttributesForCourse();
        this.onReorderCourseIndicators(args.sourceIndex, args.targetIndex);
      }
      if(this.forMaterialDashboard){
       this.negateOtherAttributesForMaterial();
        this.onReorderMaterialIndicators(args.sourceIndex, args.targetIndex);
      }
      if(this.forChannelDashboard){
        this.negateOtherAttributesForChannel();
        this.onReorderChannelIndicators(args.sourceIndex, args.targetIndex);
      }
      if(this.forTopicDashboard){
        this.negateOtherAttributesForTopic();
        this.onReorderTopicIndicators(args.sourceIndex, args.targetIndex);
        
      }
    });
  }

  getIndicatorToDelete(indicator) {
    this.indicator = indicator;
  }

  onDeleteIndicator(indicator) {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to delete the Indicator?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.onConfirmDeleteIndicator(indicator),
    });
  }

  onConfirmDeleteIndicator(indicator) {

    if (this.forCourseDashboard) {
      this.negateOtherAttributesForCourse();
      this.confirmCourseIndicatorDeletion(indicator);
    }
    if (this.forPersonalDashboard) {
      this.negateOtherAttributesForPersonal();
      this.confirmPersonalIndicatorDeletion(indicator);
    }
    if (this.forMaterialDashboard) {
     this.negateOtherAttributesForMaterial();
      this.confirmMaterialIndicatorDeletion(indicator);
    }
    if(this.forChannelDashboard){
     this.negateOtherAttributesForChannel();
      this.confirmChannelIndicatorDeletion(indicator)
    }
    if(this.forTopicDashboard){
      this.negateOtherAttributesForTopic();
      this.confirmTopicIndicatorDeletion(indicator)
    }
  }
  
  confirmCourseIndicatorDeletion(indicator) {
    this.indicatorService
      .deleteIndicator(indicator, this.courseId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }
  confirmPersonalIndicatorDeletion(indicator) {
    this.indicatorService
      .deleteUserIndicator(indicator._id)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  confirmMaterialIndicatorDeletion(indicator) {
    this.indicatorService
      .deleteMaterialIndicator(indicator._id, this.materialId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  confirmChannelIndicatorDeletion(indicator) {
    this.indicatorService
      .deleteChannelIndicator(indicator._id, this.channelId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  confirmTopicIndicatorDeletion(indicator) {
    this.indicatorService
      .deleteTopicIndicator(indicator._id, this.courseId, this.topicId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }


  onReorderCourseIndicators(sourceIndex, targetIndex) {
    this.indicatorService
      .reorderIndicators(sourceIndex, targetIndex, this.courseId)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });
  }
  onReorderPersonalIndicators(sourceIndex, targetIndex) {
    this.indicatorService
      .reorderUserIndicators(sourceIndex, targetIndex)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });
  }

  onReorderMaterialIndicators(sourceIndex, targetIndex) {
    console.log(this.materialId)
    
    this.indicatorService
      .reorderMaterialIndicators(sourceIndex, targetIndex, this.materialId)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });
  }

  onReorderChannelIndicators(sourceIndex, targetIndex) {
    this.indicatorService
      .reorderChannelIndicators(sourceIndex, targetIndex, this.channelId)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });
  }

  onReorderTopicIndicators(sourceIndex, targetIndex) {
    this.indicatorService
      .reorderTopicIndicators(sourceIndex, targetIndex, this.topicId)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfoError = new ShowInfoError(this.messageService);
          this.showInfoError.showInfo(res.success);
        } else {
          this.showInfoError.showError(res.errorMsg);
        }
      });
  }



 

  updateCourseIndicator(indicator: Indicator) {
    this.indicatorService
      .updateIndicator(indicator,this.courseId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }
  updatePersonalIndicator(indicator: Indicator) {
    this.indicatorService
      .updateUserIndicator(indicator)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  updateMaterialIndicator(indicator: Indicator) {
    this.indicatorService
      .updateMaterialIndicator(indicator, this.materialId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  updateChannelIndicator(indicator: Indicator) {
    this.indicatorService
      .updateChannelIndicator(indicator, this.channelId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  updateTopicIndicator(indicator: Indicator) {
    this.indicatorService
      .updateTopicIndicator(indicator, this.topicId)
      .subscribe((res: any) => {
        let showInfoError = new ShowInfoError(this.messageService);
        if ('success' in res) {
          showInfoError.showInfo(res.success);
        } else {
          showInfoError.showError(res.errorMsg);
        }
      });
  }

  UpdateIdsFromUrl(){
    const url = this.router.url;
    if (url.includes('course') && url.includes('topic')) {
      const courseRegex = /\/course\/(\w+)/;
      const topicRegex = /\/topic\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const topicId = topicRegex.exec(url)[1];
      this.topicId = topicId;
      this.courseId = courseId      
    }
    if(url.includes('course') && url.includes('channel')){
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex = /\/channel\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = url.match(/material:(.*?)\/(pdf|video)/)?.[1];
      this.channelId = channelId;
      this.courseId = courseId; 
      this.materialId = materialId 
    }

    if (url.includes('course') && url.includes('channel') && url.includes('materialDashboard')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex  = /\/channel\/(\w+)/;
      const materialRegex =  /\/materialDashboard\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = materialRegex.exec(url)[1];
      this.courseId = courseId
      this.channelId = channelId
      this.materialId = materialId      
    }
    
  }
}
