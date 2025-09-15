import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl, SafeStyle } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {

  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi
  ];

  private readonly dangerousProtocols = [
    'javascript:',
    'data:text/html',
    'vbscript:',
    'file:',
    'about:'
  ];

  constructor(private sanitizer: DomSanitizer) {}

  sanitizeHtml(content: string): string {
    if (!content) return '';
    
    if (this.detectXSSAttempt(content)) {
      return '';
    }
    
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, content);
    return sanitized || '';
  }

  sanitizeText(content: string): string {
    if (!content) return '';
    
    if (this.detectXSSAttempt(content)) {
      return '';
    }
    
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
    return sanitized.replace(/<[^>]*>/g, '').trim();
  }

  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    const lowercaseUrl = url.toLowerCase();
    for (const protocol of this.dangerousProtocols) {
      if (lowercaseUrl.includes(protocol)) {
        return '';
      }
    }
    
    const sanitized = this.sanitizer.sanitize(SecurityContext.URL, url);
    return sanitized || '';
  }

  sanitizeStyle(style: string): string {
    if (!style) return '';
    
    if (this.detectDangerousCSS(style)) {
      return '';
    }
    
    const sanitized = this.sanitizer.sanitize(SecurityContext.STYLE, style);
    return sanitized || '';
  }

  trustHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  trustUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  trustStyle(style: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  sanitizeName(name: string): string {
    if (!name) return '';
    
    const sanitized = this.sanitizeText(name);
    const cleanName = sanitized.replace(/[^a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\s\-'.]/g, '').trim();
    
    return cleanName.length > 100 ? cleanName.substring(0, 100) : cleanName;
  }

  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    const sanitized = this.sanitizeText(email);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (sanitized.length > 254) {
      return '';
    }
    
    return emailRegex.test(sanitized) ? sanitized.toLowerCase() : '';
  }

  sanitizePhone(phone: string): string {
    if (!phone) return '';
    
    const sanitized = this.sanitizeText(phone);
    const cleanPhone = sanitized.replace(/[^0-9\s\-()+.]/g, '').trim();
    
    return cleanPhone.length > 20 ? '' : cleanPhone;
  }

  sanitizeStudentFormData(formData: any): any {
    if (!formData || typeof formData !== 'object') return {};

    const sanitized = { ...formData };

    if (sanitized.firstname) {
      sanitized.firstname = this.sanitizeName(sanitized.firstname);
    }
    
    if (sanitized.lastname) {
      sanitized.lastname = this.sanitizeName(sanitized.lastname);
    }
    
    if (sanitized.placeOfBirth) {
      sanitized.placeOfBirth = this.sanitizeText(sanitized.placeOfBirth);
    }
    
    if (sanitized.email) {
      sanitized.email = this.sanitizeEmail(sanitized.email);
    }
    
    if (sanitized.phone) {
      sanitized.phone = this.sanitizePhone(sanitized.phone);
    }
    
    if (sanitized.commentaire) {
      sanitized.commentaire = this.sanitizeHtml(sanitized.commentaire);
    }

    if (sanitized.address) {
      sanitized.address = this.sanitizeText(sanitized.address);
    }
    
    if (sanitized.city) {
      sanitized.city = this.sanitizeText(sanitized.city);
    }
    
    if (sanitized.postalCode) {
      sanitized.postalCode = this.sanitizeText(sanitized.postalCode);
    }

    return sanitized;
  }

  private detectXSSAttempt(content: string): boolean {
    if (!content) return false;
    
    return this.xssPatterns.some(pattern => pattern.test(content));
  }

  private detectDangerousCSS(style: string): boolean {
    if (!style) return false;
    
    const dangerous = [
      'expression(',
      'javascript:',
      '@import',
      'behavior:',
      '-moz-binding',
      'url('
    ];
    
    const lowerStyle = style.toLowerCase();
    return dangerous.some(danger => lowerStyle.includes(danger));
  }

  containsHtml(content: string): boolean {
    if (!content) return false;
    return /<[^>]*>/g.test(content);
  }

  isContentSafe(content: string): boolean {
    if (!content) return true;
    
    if (this.detectXSSAttempt(content)) return false;
    
    const lowercaseContent = content.toLowerCase();
    for (const protocol of this.dangerousProtocols) {
      if (lowercaseContent.includes(protocol)) return false;
    }
    
    return true;
  }

  validateCriticalData(data: any, allowedFields: string[]): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const dataKeys = Object.keys(data);
    for (const key of dataKeys) {
      if (!allowedFields.includes(key)) {
        return false;
      }
      
      if (typeof data[key] === 'string' && !this.isContentSafe(data[key])) {
        return false;
      }
    }
    
    return true;
  }

  secureLog(message: string, data?: any): void {
    const safeMessage = this.sanitizeText(message);
    const safeData = data ? this.sanitizeText(JSON.stringify(data).substring(0, 200)) : '';
    
    
  }
}