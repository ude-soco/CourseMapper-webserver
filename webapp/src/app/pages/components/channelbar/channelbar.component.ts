import { TopicChannelService } from '../../../services/topic-channel.service';
import { CourseService } from '../../../services/course.service';
import { Component, EventEmitter, OnInit, HostListener } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { Channel } from 'src/app/models/Channel';
import { Topic } from 'src/app/models/Topic';
import { MenuItem } from 'primeng/api';
import { environment } from 'src/environments/environment';
import { catchError, of } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { State } from 'src/app/state/app.state';
import { Store } from '@ngrx/store';
import * as AppActions from 'src/app/state/app.actions'

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class ChannelbarComponent implements OnInit {
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<State>
  ) {
      this.route.params.subscribe(params => {
      if(params['courseID']){
        this.courseService.fetchCourses().subscribe((courses) => {
          this.selectedCourse = courses.find((course) => course._id == params['courseID']);
          this.courseService.selectCourse(this.selectedCourse);
          this.store.dispatch(AppActions.toggleCourseSelected({courseSelected: true}));
        });
      }
    })
  }

  private API_URL = environment.API_URL;
  selectedCourse: Course = new CourseImp('', '');
  displayAddTopicDialogue: boolean = false;
  editable: boolean = false;
  escapeKey: boolean = false;
  enterKey: boolean = false;
  previousCourse: Course = new CourseImp('', '');
  insertedText: string = '';
  selectedId: string = '';

  options: MenuItem[] = [
    {
      label: 'Rename',
      icon: 'pi pi-refresh',
      command: () => this.onRenameCourse(),
    },
    {
      label: 'Delete',
      icon: 'pi pi-times',
      command: () => this.onDeleteCourse(),
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => this.onDashBoard()
    },
  ];

  ngOnInit(): void {
      this.selectedCourse = this.courseService.getSelectedCourse();
      //3
      this.courseService.onSelectCourse.subscribe((course) => {
        this.selectedCourse = course;
      });
  }

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent) {
    // to confirm rename when mouse clicked anywhere
    if (this.editable) {
      //course name <p> has been changed to editable
      console.log('logged to mouse event');
      this.enterKey = false;
      this.onRenameCourseConfirm(this.selectedId);
    }
  }

  /**
   * @function confirmDeletion
   * triggered from the ui when user confirms on deletetion
   *
   */
  confirmDeletion() {
    this.courseService.deleteCourse(this.selectedCourse).subscribe((res) => {
      if ('success' in res) {
        this.showInfo(res['success']);
        this.router.navigate(['home']);
      } else {
        this.showError(res['errorMsg']);
      }
    });
  }

  onRenameCourse() {
    let selectedCurs = <HTMLInputElement>(
      document.getElementById(`${this.selectedCourse._id}`)
    );
    this.selectedId = this.selectedCourse._id;
    selectedCurs.contentEditable = 'true';
    this.previousCourse = this.selectedCourse;
    this.selectElementContents(selectedCurs);
  }

  onRenameCourseConfirm(id) {
    const selectedCurs = <HTMLInputElement>document.getElementById(id);
    if (this.enterKey) {
      //confirmed by keyboard
      let CourseName = this.previousCourse.name;
      const courseDescription = this.previousCourse.description;
      let body = { name: CourseName, description: courseDescription };
      let newCourseName = this.insertedText;
      newCourseName = newCourseName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (newCourseName && newCourseName !== '') {
        body = {
          name: newCourseName,
          description: courseDescription, //keep description value
        };
      }
      this.enterKey = false;
      this.courseService.renameCourse(this.previousCourse, body).subscribe();
    } else if (this.escapeKey === true) {
      //ESC pressed
      console.log('ESC Pressed');
      let CourseName = this.previousCourse.name;
      const courseDescription = this.previousCourse.description;
      let body = { name: CourseName, description: courseDescription };
      this.escapeKey = false;
      this.courseService.renameCourse(this.selectedCourse, body).subscribe();
    } else {
      //confirmed by mouse click
      console.log('logged from mouse');
      let CourseName = this.previousCourse.name;
      const courseDescription = this.previousCourse.description;
      let body = { name: CourseName, description: courseDescription };
      let newCourseName = this.insertedText;
      newCourseName = newCourseName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (
        newCourseName &&
        newCourseName !== '' &&
        newCourseName !== this.previousCourse.name
      ) {
        body = {
          name: newCourseName,
          description: courseDescription, //keep description value
        };
      }
      this.editable = false;
      this.courseService.renameCourse(this.previousCourse, body).subscribe();
    }
  }

  onTextInserted(id, e) {
    ////Prevent Special keys
    this.editable = true;
    if (
      window.getSelection().toString() ==
      (<HTMLInputElement>document.getElementById(id)).innerText
    ) {
      //all text is selected
      if (e.keyCode === 32) {
        //spacebar pressed when text is selected
        e.preventDefault(); //prevent text modification
      } else if (e.keyCode === 13) {
        // Enter pressed && All Text is selected
        e.preventDefault();
        let inText = (<HTMLInputElement>document.getElementById(id)).innerText;
        if (/\s/g.test(inText)) {
          //name !== null or white space(s)
          (<HTMLInputElement>document.getElementById(id)).contentEditable =
            'false';
          window.getSelection().removeAllRanges(); // deselect text on confirm
          this.enterKey = true;
          this.onRenameCourseConfirm(id);
        } else if (!/\s/g.test(inText)) {
          this.showError('Course name field is empty');
        } //name is null or white space(s)
      } else if (e.keyCode === 27) {
        // on ESC pressed
        e.preventDefault();
        (<HTMLInputElement>document.getElementById(id)).contentEditable =
          'false';
        this.insertedText = this.selectedCourse.name;
        window.getSelection().removeAllRanges(); // deselect text on confirm
        // (<HTMLInputElement>document.getElementById(id)).innerText=this.insertedText
        this.escapeKey = true;
        this.onRenameCourseConfirm(id);
      }
    } else if (e.keyCode === 13) {
      /**if text is not selected check following cases */
      // on Enter pressed
      // e.preventDefault();
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.enterKey = true;
      this.onRenameCourseConfirm(id);
    } else if (e.keyCode === 27) {
      // on ESC pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      this.insertedText = this.selectedCourse.name;
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.escapeKey = true;
      // (<HTMLInputElement>document.getElementById(id)).innerHTML=this.insertedText;
      this.onRenameCourseConfirm(id);
    }
    // else if(e.keyCode===8 || e.keyCode===46){//Backspace || Delete
    //   //Do Nothing
    // }
    // // else{
    // //   this.insertedText= (<HTMLInputElement>document.getElementById(id)).innerText
    // //   if (e.key.length===1){this.insertedText=this.insertedText+e.key}
    // // }
  }

  afterTextInserted(id, e) {
    //check on button release | get inner text as long as it's inserted
    if (e.keyCode === 8 || e.keyCode === 46) {
      //Backspace || delete
      this.insertedText = (<HTMLInputElement>(
        document.getElementById(id)
      )).innerText;
    } else if (e.keyCode !== 32 && e.keyCode !== 27) {
      //not (enter, esc)
      this.insertedText = (<HTMLInputElement>(
        document.getElementById(id)
      )).innerText;
    }
  }

  onAddTopicDialogueClicked() {
    this.toggleAddTopicDialogueClicked(true);
  }

  toggleAddTopicDialogueClicked(visibilty) {
    this.displayAddTopicDialogue = visibilty;
  }

  selectElementContents(el) {
    // select text on rename
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * @function showInfo
   * shows the user if his action succeeded
   *
   */
  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  /**
   * @function showError
   * shows the user if his action failed
   *
   */
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  /**
   * @function informUser
   * inform user about the result of his action
   *
   */
  informUser(severity, summary, detail) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
    });
  }

  /**
   * @function onDeleteCourse
   * triggered from the ui when user click on delete
   *
   */
  onDeleteCourse() {
    this.confirmationService.confirm({
      message: 'Do you want to delete this course?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.confirmDeletion(),
      reject: () => this.informUser('info', 'Cancelled', 'Deletion cancelled'),
    });
  }

  onDashBoard(){
    this.router.navigate([
      'course',
      this.courseService.getSelectedCourse()._id,
      'dashboard'
    ]);
  }
}
