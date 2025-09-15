import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info' | 'primary';
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  private confirmationSubject = new BehaviorSubject<ConfirmationConfig | null>(null);
  private resultSubject = new BehaviorSubject<boolean | null>(null);

  constructor() {}

  confirm(config: Partial<ConfirmationConfig>): Observable<boolean> {
    const defaultConfig: ConfirmationConfig = {
      title: "Confirmer l'action",
      message: 'Êtes-vous sûr de vouloir continuer ?',
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      type: 'danger',
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.confirmationSubject.next(finalConfig);

    return this.resultSubject.asObservable().pipe(
      filter(result => result !== null),
      map(result => result as boolean)
    );
  }

  getConfirmation(): Observable<ConfirmationConfig | null> {
    return this.confirmationSubject.asObservable();
  }

  resolve(result: boolean): void {
    this.resultSubject.next(result);
    this.confirmationSubject.next(null);
  }
}
