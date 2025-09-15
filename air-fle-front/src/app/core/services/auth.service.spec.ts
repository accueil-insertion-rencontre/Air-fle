import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from './auth.service';
import { User } from '../models';
import { CookieService } from './cookie.service';
import { environment } from '@environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    user_uuid: '1',
    user_firstname: 'John',
    user_lastname: 'Doe',
    user_mail: 'test@example.com',
    user_isactive: true,
    user_created_at: new Date(),
    role_uuid: 'admin-role-uuid',
    role: {
      role_uuid: 'admin-role-uuid',
      role_name: 'admin',
      role_description: 'Administrator'
    }
  };

  beforeEach(() => {
    const cookieSpy = jasmine.createSpyObj('CookieService', [
      'setSecureToken',
      'getToken',
      'deleteToken'
    ]);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: CookieService, useValue: cookieSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    cookieServiceSpy = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token in cookies', () => {
      const mockResponse = {
        data: {
          access_token: 'fake-jwt-token',
          user: mockUser
        }
      };

      service.login('test@example.com', 'password').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.currentUser).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password'
      });

      req.flush(mockResponse);

      expect(cookieServiceSpy.setSecureToken).toHaveBeenCalledWith('fake-jwt-token');
    });

    it('should handle login error gracefully', () => {
      const errorResponse = { message: 'Invalid credentials' };

      service.login('wrong@example.com', 'wrongpassword').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Invalid credentials');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle response without token gracefully', () => {
      const mockResponse = {
        data: {
          user: mockUser
          // pas de access_token
        }
      };

      service.login('test@example.com', 'password').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(cookieServiceSpy.setSecureToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully when token exists', () => {
      cookieServiceSpy.getToken.and.returnValue('valid-token');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({});

      expect(cookieServiceSpy.deleteToken).toHaveBeenCalled();
      expect(service.currentUser).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should logout when API call fails', () => {
      cookieServiceSpy.getToken.and.returnValue('valid-token');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(cookieServiceSpy.deleteToken).toHaveBeenCalled();
      expect(service.currentUser).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should clear auth data when no token exists', () => {
      cookieServiceSpy.getToken.and.returnValue(null);

      service.logout();

      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
      expect(cookieServiceSpy.deleteToken).toHaveBeenCalled();
      expect(service.currentUser).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('currentUser getter', () => {
    it('should return current user', () => {
      // Simuler un utilisateur connecté
      const mockResponse = {
        data: {
          access_token: 'fake-jwt-token',
          user: mockUser
        }
      };

      service.login('test@example.com', 'password').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(service.currentUser).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      expect(service.currentUser).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      cookieServiceSpy.getToken.and.returnValue('valid-token');
      
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when no token exists', () => {
      cookieServiceSpy.getToken.and.returnValue(null);
      
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return false when token is empty string', () => {
      cookieServiceSpy.getToken.and.returnValue('');
      
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from cookie service', () => {
      cookieServiceSpy.getToken.and.returnValue('test-token');
      
      expect(service.getToken()).toBe('test-token');
      expect(cookieServiceSpy.getToken).toHaveBeenCalled();
    });

    it('should return null when no token exists', () => {
      cookieServiceSpy.getToken.and.returnValue(null);
      
      expect(service.getToken()).toBeNull();
    });
  });

  describe('currentUser$ observable', () => {
    it('should emit user changes', () => {
      const users: (User | null)[] = [];
      
      service.currentUser$.subscribe(user => users.push(user));

      // Initial state
      expect(users[0]).toBeNull();

      // Login
      const mockResponse = {
        data: {
          access_token: 'fake-jwt-token',
          user: mockUser
        }
      };

      service.login('test@example.com', 'password').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(users[1]).toEqual(mockUser);

      // Logout
      cookieServiceSpy.getToken.and.returnValue('valid-token');
      service.logout();
      const logoutReq = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      logoutReq.flush({});

      expect(users[2]).toBeNull();
    });
  });

  describe('logTokenToConsole', () => {
    it('should log token to console', () => {
      spyOn(console, 'log');
      cookieServiceSpy.getToken.and.returnValue('test-token');

      service.logTokenToConsole();

      expect(console.log).toHaveBeenCalledWith('Token actuel:', 'test-token');
    });

    it('should log null token to console', () => {
      spyOn(console, 'log');
      cookieServiceSpy.getToken.and.returnValue(null);

      service.logTokenToConsole();

      expect(console.log).toHaveBeenCalledWith('Token actuel:', null);
    });
  });
}); 