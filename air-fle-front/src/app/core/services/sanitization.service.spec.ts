import { TestBed } from '@angular/core/testing';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SanitizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitizeText', () => {
    it('should remove script tags', () => {
      const maliciousInput = 'Hello <script>alert("XSS")</script> World';
      const result = service.sanitizeText(maliciousInput);
      expect(result).toBe('Hello  World');
    });

    it('should remove iframe tags', () => {
      const maliciousInput = 'Content <iframe src="malicious.com"></iframe> here';
      const result = service.sanitizeText(maliciousInput);
      expect(result).toBe('Content  here');
    });

    it('should remove javascript: protocols', () => {
      const maliciousInput = 'Click javascript:alert("XSS") here';
      const result = service.sanitizeText(maliciousInput);
      expect(result).toBe('Click alert("XSS") here');
    });

    it('should remove event handlers', () => {
      const maliciousInput = 'Text with onclick=alert("XSS") handler';
      const result = service.sanitizeText(maliciousInput);
      expect(result).toBe('Text with alert("XSS") handler');
    });

    it('should handle empty or null input', () => {
      expect(service.sanitizeText('')).toBe('');
      expect(service.sanitizeText(null)).toBe('');
      expect(service.sanitizeText(undefined)).toBe('');
    });
  });

  describe('sanitizeName', () => {
    it('should keep valid names', () => {
      expect(service.sanitizeName('Jean-Pierre')).toBe('Jean-Pierre');
      expect(service.sanitizeName("Marie O'Connor")).toBe("Marie O'Connor");
      expect(service.sanitizeName('José María')).toBe('José María');
    });

    it('should remove invalid characters', () => {
      expect(service.sanitizeName('Jean<script>alert()</script>Pierre')).toBe('JeanPierre');
      expect(service.sanitizeName('Marie123')).toBe('Marie');
      expect(service.sanitizeName('Test@#$%')).toBe('Test');
    });
  });

  describe('sanitizeEmail', () => {
    it('should keep valid emails', () => {
      expect(service.sanitizeEmail('test@example.com')).toBe('test@example.com');
      expect(service.sanitizeEmail('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk');
    });

    it('should reject invalid emails', () => {
      expect(service.sanitizeEmail('invalid-email')).toBe('');
      expect(service.sanitizeEmail('test@')).toBe('');
      expect(service.sanitizeEmail('@domain.com')).toBe('');
    });

    it('should remove malicious content from emails', () => {
      expect(service.sanitizeEmail('test<script>@example.com')).toBe('test@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep valid phone characters', () => {
      expect(service.sanitizePhone('+33 1 23 45 67 89')).toBe('+33 1 23 45 67 89');
      expect(service.sanitizePhone('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should remove invalid characters', () => {
      expect(service.sanitizePhone('+33<script>123456789')).toBe('+33123456789');
      expect(service.sanitizePhone('123abc456')).toBe('123456');
    });
  });

  describe('sanitizeStudentData', () => {
    it('should sanitize all student fields', () => {
      const maliciousData = {
        student_firstname: 'Jean<script>alert()</script>',
        student_lastname: 'Dupont<iframe></iframe>',
        student_mail: 'JEAN<script>@EXAMPLE.COM',
        student_phone: '+33<script>123456789',
        student_place_of_birth: 'Paris<script>alert()</script>',
        student_commentary: 'Commentaire avec <script>alert()</script>',
        student_birthdate: new Date('1990-01-01'),
        gender_uuid: '123e4567-e89b-12d3-a456-426614174000',
        french_level_uuid: '123e4567-e89b-12d3-a456-426614174001',
        financing_uuid: '123e4567-e89b-12d3-a456-426614174002',
        status_uuid: '123e4567-e89b-12d3-a456-426614174003'
      };

      const result = service.sanitizeStudentData(maliciousData);

      expect(result.student_firstname).toBe('Jean');
      expect(result.student_lastname).toBe('Dupont');
      expect(result.student_mail).toBe('jean@example.com');
      expect(result.student_phone).toBe('+33123456789');
      expect(result.student_place_of_birth).toBe('Paris');
      expect(result.student_commentary).toBe('Commentaire avec');
    });

    it('should handle empty or invalid data', () => {
      const result = service.sanitizeStudentData({});
      expect(result.student_firstname).toBe('');
      expect(result.student_lastname).toBe('');
    });
  });

  describe('isContentSafe', () => {
    it('should return true for safe content', () => {
      expect(service.isContentSafe('Hello World')).toBe(true);
      expect(service.isContentSafe('Jean-Pierre')).toBe(true);
      expect(service.isContentSafe('')).toBe(true);
    });

    it('should return false for dangerous content', () => {
      expect(service.isContentSafe('<script>alert()</script>')).toBe(false);
      expect(service.isContentSafe('<iframe src="malicious"></iframe>')).toBe(false);
      expect(service.isContentSafe('javascript:alert()')).toBe(false);
      expect(service.isContentSafe('onclick=alert()')).toBe(false);
    });
  });
}); 