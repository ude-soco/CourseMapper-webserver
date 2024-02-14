import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parse } from 'angular-html-parser';

export class IFrameValidators {
  static notOnlyWhitespace(control: FormControl) : ValidationErrors {
    // check if string only contains whitespace
        if ((control.value != null) && (control.value.trim().length === 0)) {

            // invalid, return error object
            return { 'notOnlyWhitespace': true };
        }
        else {
            // valid, return null
            return null;
        }
  }

static iframeValidator(): ValidatorFn {
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
}