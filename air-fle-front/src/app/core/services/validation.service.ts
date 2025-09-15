import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SanitizationService } from './sanitization.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor(private sanitizationService: SanitizationService) {}

  /**
   * Validateur personnalisé pour s'assurer qu'un champ ne contient pas de HTML
   */
  noHtmlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (this.sanitizationService.containsHtml(control.value)) {
        return { containsHtml: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Validateur pour s'assurer qu'un nom ne contient que des caractères valides
   */
  validNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const sanitized = this.sanitizationService.sanitizeName(control.value);
      if (sanitized !== control.value) {
        return { invalidNameCharacters: { value: control.value, sanitized } };
      }

      return null;
    };
  }

  /**
   * Validateur pour s'assurer qu'un email est valide après sanitisation
   */
  validSanitizedEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const sanitized = this.sanitizationService.sanitizeEmail(control.value);
      if (!sanitized || sanitized !== control.value) {
        return { invalidSanitizedEmail: { value: control.value, sanitized } };
      }

      return null;
    };
  }

  /**
   * Validateur pour s'assurer qu'un téléphone est valide après sanitisation
   */
  validSanitizedPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const sanitized = this.sanitizationService.sanitizePhone(control.value);
      if (sanitized !== control.value) {
        return { invalidSanitizedPhone: { value: control.value, sanitized } };
      }

      return null;
    };
  }
} 