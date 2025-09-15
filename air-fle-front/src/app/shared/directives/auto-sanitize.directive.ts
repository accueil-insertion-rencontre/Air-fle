import { Directive, ElementRef, HostListener, Input, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { SanitizationService } from '@core/services';

@Directive({
  selector: '[appAutoSanitize]',
  standalone: true
})
export class AutoSanitizeDirective implements OnInit, OnDestroy {
  @Input() sanitizeType: 'text' | 'name' | 'email' | 'phone' | 'html' = 'text';
  @Input() strictMode: boolean = true;
  @Input() showWarnings: boolean = true;

  private debounceTimer?: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private sanitizationService: SanitizationService
  ) {}

  ngOnInit(): void {
    this.updateVisualIndicator();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }


  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    this.sanitizeContent(event);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.sanitizeContent(event);
    }, 300);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    
    if (!this.sanitizationService.isContentSafe(pastedText)) {
      this.showSecurityWarning();
      return;
    }

    const sanitizedText = this.getSanitizedValue(pastedText);
    this.updateElementValue(sanitizedText);
    this.updateVisualIndicator();
  }


  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (!this.strictMode) return;

    const droppedData = event.dataTransfer?.getData('text') || '';
    
    if (!this.sanitizationService.isContentSafe(droppedData)) {
      event.preventDefault();
      this.showSecurityWarning();
    }
  }

     private sanitizeContent(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

    const originalValue = target.value;
    
    if (!this.sanitizationService.isContentSafe(originalValue)) {
      this.showSecurityWarning();
      target.value = '';
      return;
    }

    const sanitizedValue = this.getSanitizedValue(originalValue);
    
    if (originalValue !== sanitizedValue) {
      this.updateElementValue(sanitizedValue);
      this.updateVisualIndicator();
    }
  }

  private getSanitizedValue(value: string): string {
    switch (this.sanitizeType) {
      case 'name':
        return this.sanitizationService.sanitizeName(value);
      case 'email':
        return this.sanitizationService.sanitizeEmail(value);
      case 'phone':
        return this.sanitizationService.sanitizePhone(value);
      case 'html':
        return this.sanitizationService.sanitizeHtml(value);
      case 'text':
      default:
        return this.sanitizationService.sanitizeText(value);
    }
  }

  private updateElementValue(value: string): void {
    const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

     private updateVisualIndicator(): void {
    if (!this.showWarnings) return;

    const element = this.el.nativeElement;
    const value = element.value || '';

    this.renderer.removeClass(element, 'sanitized-input');
    this.renderer.removeClass(element, 'contains-html');
    this.renderer.removeClass(element, 'unsafe-content');

    if (value) {
      if (this.sanitizationService.containsHtml(value)) {
        this.renderer.addClass(element, 'contains-html');
      } else if (this.sanitizationService.isContentSafe(value)) {
        this.renderer.addClass(element, 'sanitized-input');
      } else {
        this.renderer.addClass(element, 'unsafe-content');
      }
    }
  }

  private showSecurityWarning(): void {
    if (!this.showWarnings) return;

    const element = this.el.nativeElement;
    this.renderer.addClass(element, 'unsafe-content');
    
    setTimeout(() => {
      this.renderer.removeClass(element, 'unsafe-content');
    }, 3000);
  }
} 