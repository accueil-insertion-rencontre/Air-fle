import { Injectable } from '@angular/core';

// Bootstrap JS n'est plus requis; on affiche une overlay CSS/HTML simple

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  /**
   * Affiche une confirmation stylée
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<boolean> - true si confirmé, false sinon
   */
  confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    return new Promise(resolve => {
      this.createConfirmModal(message, title, resolve);
    });
  }

  /**
   * Affiche une alerte de succès
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  success(message: string, title: string = 'Succès'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'success', resolve);
    });
  }

  /**
   * Affiche une alerte d'erreur
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  error(message: string, title: string = 'Erreur'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'danger', resolve);
    });
  }

  /**
   * Affiche une alerte d'information
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  info(message: string, title: string = 'Information'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'info', resolve);
    });
  }

  /**
   * Crée une modal de confirmation
   */
  private createConfirmModal(
    message: string,
    title: string,
    resolve: (value: boolean) => void
  ): void {
    const modalId = 'confirmModal_' + Date.now();

    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${title}
              </h5>
            </div>
            <div class="modal-body p-4">
              <p class="mb-0">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="modal-footer border-0 bg-light">
              <button type="button" class="btn btn-secondary" data-action="cancel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Annuler
              </button>
              <button type="button" class="btn btn-danger" data-action="confirm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Ajouter la modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const closeAndCleanup = () => {
      modalElement.remove();
    };

    // Backdrop click ou boutons
    modalElement.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      if (action === 'confirm') {
        resolve(true);
        closeAndCleanup();
      } else if (action === 'cancel' || target.classList.contains('modal')) {
        resolve(false);
        closeAndCleanup();
      }
    });
  }

  /**
   * Crée une modal d'alerte
   */
  private createAlertModal(
    message: string,
    title: string,
    type: string,
    resolve: () => void
  ): void {
    const modalId = 'alertModal_' + Date.now();

    const typeConfig = {
      success: { icon: 'fa-check-circle', bgClass: 'bg-success' },
      danger: { icon: 'fa-exclamation-circle', bgClass: 'bg-danger' },
      info: { icon: 'fa-info-circle', bgClass: 'bg-info' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;

    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header ${config.bgClass} text-white">
              <h5 class="modal-title">
                ${this.iconSvgForType(type)}${title}
              </h5>
            </div>
            <div class="modal-body p-4">
              <p class="mb-0">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="modal-footer border-0 bg-light">
              <button type="button" class="btn btn-primary" data-action="ok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="20 6 9 17 4 12"/></svg>OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Ajouter la modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const closeAndCleanup = () => {
      modalElement.remove();
    };

    modalElement.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      if (action === 'ok' || target.classList.contains('modal')) {
        resolve();
        closeAndCleanup();
      }
    });
  }

  private iconSvgForType(type: string): string {
    switch (type) {
      case 'success':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="20 6 9 17 4 12"/></svg>';
      case 'danger':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case 'info':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      default:
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="12" r="10"/></svg>';
    }
  }
}
