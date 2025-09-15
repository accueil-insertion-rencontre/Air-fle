import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ConfirmationService,
  ConfirmationConfig,
} from '../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  config: ConfirmationConfig | null = null;
  visible = false;
  private subscription: Subscription = new Subscription();

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.getConfirmation().subscribe(config => {
      this.config = config;
      if (config) {
        this.visible = true;
      } else {
        this.visible = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onBackdropClick(evt: MouseEvent): void {
    const target = evt.target as HTMLElement;
    if (target && target.id === 'confirmationModal') {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmationService.resolve(true);
  }

  onCancel(): void {
    this.confirmationService.resolve(false);
  }

  getButtonClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'info':
        return 'btn-info';
      case 'primary':
        return 'btn-primary';
      default:
        return 'btn-danger';
    }
  }

  // Icône rendue en SVG dans le template
}
