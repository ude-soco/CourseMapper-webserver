import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parse } from 'angular-html-parser';

export function iframeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let valid = false;
    let iframeCount = 0;
    let freeText = false;
    if (control.value) {
      const { rootNodes, errors } = parse(control.value);

      rootNodes.forEach(node => {
        if (node['name'] === 'iframe') {
          iframeCount ++;
        } 
        if (node['type'] === 'text') {
          freeText = true;
        }
      });

      if (errors.length === 0 && iframeCount === 1 && !freeText) {
        valid = true;
      }
    } else {
      valid = true;
    }

    return !valid ? { invalidInput: { value: control.value } } : null;
  };
}
