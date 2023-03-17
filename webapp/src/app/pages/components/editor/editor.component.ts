import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { parse } from 'angular-html-parser';
import { iframeValidator } from '../../../validators/iframe.validators';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
  renderIndicatorForm: FormGroup;
  @ViewChild('indicators') div: ElementRef;
  currentIframe = null;
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderIndicatorForm = new FormGroup({
      indicatorIframe: new FormControl(null, [
        Validators.required,
        iframeValidator(),
      ]),
    });
  }

  showIndicator() {
    const neededAttributes = ['src', 'width', 'height', 'title', 'name'];
    let attrs = [];
    if (this.renderIndicatorForm.valid) {
      const { rootNodes, errors } = parse(
        this.renderIndicatorForm.value.indicatorIframe
      );

      rootNodes.forEach((node) => {
        if (node['name'] === 'iframe') {
          node['attrs'].forEach((attr) => {
            if (neededAttributes.includes(attr['name'])) {
              attrs.push({ name: attr['name'], value: attr['value'] });
            }
          });
        }
      });

      // for (let i in rootNodes) {
      //   if (rootNodes[i]['name'] === 'iframe') {
      //     for (let j in rootNodes[i]['attrs']) {
      //       if ( neededAttributes.includes(rootNodes[i]['attrs'][j]['name'])) {
      //         attrs.push({name: rootNodes[i]['attrs'][j]['name'], value: rootNodes[i]['attrs'][j]['value']});
      //       }
      //     }
      //   }
      // }
      this.clearFormInput();
      this.addIframe(attrs);
    }
  }

  clearFormInput(){
    this.renderIndicatorForm.reset();
  }

  addIframe(attrs) {
    const iframe: HTMLIFrameElement = this.renderer.createElement('iframe');
    attrs.forEach((attr) => {
      iframe[attr['name']] = attr['value'];
    });
    if (this.currentIframe !== null) {
      this.renderer.removeChild(this.div.nativeElement, this.currentIframe);
    }
    this.currentIframe = iframe;
    this.renderer.appendChild(this.div.nativeElement, this.currentIframe);
  }
}
