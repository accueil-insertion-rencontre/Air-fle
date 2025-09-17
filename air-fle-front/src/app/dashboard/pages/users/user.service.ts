import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User, UpdateUserRequest } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

export interface Role {
  role_uuid: string;
  role_name: string;
  role_description?: string;
  role_created_at?: string;
}

export interface CreateUserDto {
  user_firstname: string;
  user_lastname: string;
  user_mail: string;
  user_password: string;
  user_birthdate?: string;
  user_isactive?: boolean;
  role_uuid: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private authUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getUsers(
    options: {
      skip?: number;
      take?: number;
      user_mail?: string;
      role_uuid?: string;
    } = {}
  ): Observable<{ data: User[]; total: number }> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    let params = new HttpParams();
    if (options.skip) params = params.set('skip', options.skip.toString());
    if (options.take) params = params.set('take', options.take.toString());
    if (options.user_mail) params = params.set('user_mail', options.user_mail);
    if (options.role_uuid) params = params.set('role_uuid', options.role_uuid);

    return this.http
      .get<ApiResponse<UsersResponse>>(this.apiUrl, { headers, params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              data: response.data.data,
              total: response.data.meta.total,
            };
          } else {
            throw new Error(response.message || 'Erreur lors de la récupération des utilisateurs');
          }
        })
      );
  }

  getUserById(id: string): Observable<User> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || "Erreur lors de la récupération de l'utilisateur");
        }
      })
    );
  }

  getRoles(): Observable<Role[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<ApiResponse<{roles: Role[]}>>(`${this.authUrl}/roles`, { headers }).pipe(
        map(response => {
        if (!response.success) {
          throw new Error(response.message || 'API roles: success=false');
        }
        if (!response.data || !Array.isArray(response.data.roles)) {
          throw new Error('API roles: malformed response');
        }
            return response.data.roles;
        })
      );
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || "Erreur lors de la création de l'utilisateur");
        }
      })
    );
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<User> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .patch<ApiResponse<User>>(`${this.apiUrl}/${id}`, user, { headers })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || "Erreur lors de la mise à jour de l'utilisateur");
          }
        })
      );
  }

  deleteUser(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || "Erreur lors de la suppression de l'utilisateur");
        }
      })
    );
  }

  updateUserPassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post<ApiResponse<void>>(`${environment.apiUrl}/auth/change-password`, data, { headers })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la mise à jour du mot de passe');
          }
        })
      );
  }
}
