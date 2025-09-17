import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User, UserDisplayInfo, ApiListResponse, Paginated } from '../models';
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

interface Role {
  role_uuid: string;
  role_name: string;
}

// Service pour la gestion des utilisateurs - dernière modification: 03/06/2025
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private rolesUrl = `${environment.apiUrl}/auth/roles`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // 🔥 SUPPRESSION : Plus de localStorage ! Le frontend ne stocke RIEN
  }

  /**
   * Récupère l'ID du rôle "teacher"
   */
  private getTeacherRoleId(): Observable<string> {
    return this.http.get<ApiResponse<{ roles: Role[] }>>(this.rolesUrl).pipe(
      map(response => {
        if (response && response.success && response.data && response.data.roles) {
          const teacherRole = response.data.roles.find(role => 
            role.role_name?.toLowerCase() === 'teacher' ||
            role.role_name?.toLowerCase() === 'professeur' ||
            role.role_name?.toLowerCase() === 'formateur'
          );
          if (teacherRole) {
            return teacherRole.role_uuid;
          }
        }
        throw new Error('Rôle teacher introuvable');
      }),
      catchError(() => {
        return throwError(() => new Error('Rôle teacher introuvable'));
      })
    );
  }

  /**
   * Récupère tous les utilisateurs qui peuvent être professeurs
   * 🔧 FIX TEMPORAIRE : Retourne tous les utilisateurs en attendant de connaître la vraie structure API
   */
  getTeachers(): Observable<UserDisplayInfo[]> {
    // 🔧 SOLUTION TEMPORAIRE : Récupérer tous les utilisateurs
    // Tu me diras ensuite comment identifier les professeurs dans ton API
    return this.getAllUsers().pipe(
      map(users => {
        // Convertir tous les utilisateurs en UserDisplayInfo
        return users.map(user => this.convertToDisplayInfo(user));
      }),
      catchError(() => {
        // Si ça plante, retourner un tableau vide
        return of([]);
      })
    );
  }

  /**
   * ANCIENNE MÉTHODE (désactivée temporairement)
   * Une fois que tu m'auras dit comment identifier les professeurs, je la remets
   */
  private getTeachersWithRoleFilter(): Observable<UserDisplayInfo[]> {
    return this.getTeacherRoleId().pipe(
      switchMap(teacherRoleId => {
        const params = new HttpParams().set('role_uuid', teacherRoleId);

        return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl, { params }).pipe(
          map(response => {
            if (response && response.success && response.data) {
              let users: User[] = [];
              if (response.data.data && Array.isArray(response.data.data)) {
                users = response.data.data;
              } else if (Array.isArray(response.data)) {
                users = response.data;
              }
              
              return users.map(user => this.convertToDisplayInfo(user));
            }
            return [];
          })
        );
      }),
      catchError(() => {
        return this.getTeachersFallback();
      })
    );
  }

  /**
   * Méthode de fallback : récupère tous les utilisateurs et filtre les teachers côté client
   */
  private getTeachersFallback(): Observable<UserDisplayInfo[]> {
    return this.getAllUsers().pipe(
      map(users => {
        const teachers = users.filter(user => {
          const isTeacher =
            user.role_uuid &&
            (user.role_details?.role_name?.toLowerCase() === 'teacher' ||
              user.role_details?.role_name?.toLowerCase() === 'professeur' ||
              user.role_details?.role_name?.toLowerCase() === 'formateur');
          return isTeacher;
        });

        return teachers.map(teacher => this.convertToDisplayInfo(teacher));
      })
    );
  }

  /**
   * Récupère tous les utilisateurs
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiListResponse<User> | Paginated<User> | User[]>(this.apiUrl).pipe(
      map((response) => {
        if ('data' in response && Array.isArray(response['data'])) return (response['data'] as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        if ('data' in response && response['data'] && 'data' in (response['data'] as unknown as Record<string, unknown>) && Array.isArray((response['data'] as unknown as Record<string, unknown>)['data'])) return ((response['data'] as unknown as Record<string, unknown>)['data'] as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        if (Array.isArray(response)) return (response as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un utilisateur par son ID
   */
  getUserById(id: string | number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return this.convertToFrontendModel(response.data as unknown as Record<string, unknown>);
        }
        throw new Error('Utilisateur non trouvé');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Convertit un utilisateur en format d'affichage pour les sélecteurs
   */
  getUserDisplayInfo(user: User): UserDisplayInfo {
    return this.convertToDisplayInfo(user);
  }

  /**
   * Convertit une liste d'utilisateurs en format d'affichage
   */
  getUsersDisplayInfo(users: User[]): UserDisplayInfo[] {
    return users.map(user => this.convertToDisplayInfo(user));
  }

  /**
   * Récupère tous les utilisateurs
   */
  getUsers(): Observable<User[]> {
    return this.http.get<ApiListResponse<User> | Paginated<User> | User[]>(`${this.apiUrl}`).pipe(
      map((response) => {
        if ('data' in response && Array.isArray(response['data'])) return (response['data'] as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        if ('data' in response && response['data'] && 'data' in (response['data'] as unknown as Record<string, unknown>) && Array.isArray((response['data'] as unknown as Record<string, unknown>)['data'])) return ((response['data'] as unknown as Record<string, unknown>)['data'] as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        if (Array.isArray(response)) return (response as User[]).map(u => this.convertToFrontendModel(u as unknown as Record<string, unknown>));
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Crée un nouvel utilisateur
   */
  createUser(user: Partial<User>): Observable<User> {
    const apiUser = this.convertToApiModel(user);
    return this.http.post<{data: User} | User>(this.apiUrl, apiUser).pipe(
      map(response => {
        if (response && 'data' in response) {
          return this.convertToFrontendModel(response['data'] as unknown as Record<string, unknown>);
        }
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * Met à jour un utilisateur
   */
  updateUser(id: string | number, user: Partial<User>): Observable<User> {
    const apiUser = this.convertToApiModel(user);
    return this.http.put<{data: User} | User>(`${this.apiUrl}/${id}`, apiUser).pipe(
      map(response => {
        if (response && (response as Record<string, unknown>)['data']) {
          return this.convertToFrontendModel((response as Record<string, unknown>)['data'] as unknown as Record<string, unknown>);
        }
        throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
      }),
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * Supprime un utilisateur
   */
  deleteUser(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        throw err;
      })
    );
  }

  /**
   * 🔥 SUPPRESSION COMPLÈTE : Plus de gestion locale de l'utilisateur !
   * L'authentification se fait côté API/Auth Guard seulement
   */

  /**
   * Gestion des erreurs
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur: ${error.status}, message: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Convertit une réponse API vers le modèle frontend
   */
  private convertToFrontendModel(apiUser: Record<string, unknown>): User {
    return {
      // ✅ NOUVEAUX CHAMPS - VALEURS DE L'API SEULEMENT
      user_uuid: apiUser['user_uuid'] as string,
      user_firstname: apiUser['user_firstname'] as string,
      user_lastname: apiUser['user_lastname'] as string,
      user_mail: apiUser['user_mail'] as string,
      user_password: apiUser['user_password'] as string,
      role_uuid: apiUser['role_uuid'] as string,
      user_isactive: apiUser['user_isactive'] as boolean,
      user_created_at: new Date(apiUser['user_created_at'] as string || new Date()),

      // 🔄 ANCIENS CHAMPS (fallback UNIQUEMENT - PAS de valeurs par défaut inventées)
      id: (apiUser['user_uuid'] || apiUser['id']) as string | number,
      firstname: (apiUser['user_firstname'] || apiUser['firstname']) as string,
      lastname: (apiUser['user_lastname'] || apiUser['lastname']) as string,
      email: (apiUser['user_mail'] || apiUser['email']) as string,
      // 🔥 SUPPRESSION : Plus de role par défaut ! Si pas de rôle = undefined
      role: apiUser['role'] ? {
        role_uuid: (apiUser['role'] as Record<string, unknown>)['role_uuid'] as string,
        role_name: (apiUser['role'] as Record<string, unknown>)['role_name'] as string,
        role_description: (apiUser['role'] as Record<string, unknown>)['role_description'] as string | undefined,
        role_created_at: (apiUser['role'] as Record<string, unknown>)['role_created_at'] as string | undefined
      } : undefined,
      isActive: apiUser['user_isactive'] !== undefined ? apiUser['user_isactive'] as boolean : apiUser['isActive'] as boolean,

      // Relations (SI elles existent dans l'API)
      role_details: apiUser['role_details'] ? {
        role_uuid: (apiUser['role_details'] as Record<string, unknown>)['role_uuid'] as string,
        role_name: (apiUser['role_details'] as Record<string, unknown>)['role_name'] as string,
        role_created_at: new Date((apiUser['role_details'] as Record<string, unknown>)['role_created_at'] as string || new Date())
      } : undefined,

      created_at: (apiUser['user_created_at'] || apiUser['created_at']) as string,
      updated_at: apiUser['updated_at'] as string
    };
  }

  /**
   * Convertit un utilisateur en format d'affichage
   */
  private convertToDisplayInfo(user: User | Record<string, unknown>): UserDisplayInfo {
    const firstname = (user['user_firstname'] || user['firstname'] || '') as string;
    const lastname = (user['user_lastname'] || user['lastname'] || '') as string;
    
    return {
      user_uuid: (user['user_uuid'] || user['id']) as string,
      user_firstname: firstname,
      user_lastname: lastname,
      user_mail: (user['user_mail'] || user['email']) as string,
      fullName: `${firstname} ${lastname}`.trim() || 'Utilisateur inconnu',
      // Anciens champs pour compatibilité
      id: (user['user_uuid'] || user['id']) as string | number,
      firstname,
      lastname,
      email: (user['user_mail'] || user['email']) as string,
    };
  }

  /**
   * Convertit un modèle frontend vers l'API - VALEURS STRICTES SEULEMENT
   */
  private convertToApiModel(user: Partial<User>): Record<string, unknown> {
    return {
      user_firstname: user.user_firstname || user.firstname,
      user_lastname: user.user_lastname || user.lastname,
      user_mail: user.user_mail || user.email,
      user_password: user.user_password,
      role_uuid: user.role_uuid, // OBLIGATOIRE - pas de fallback inventé
      user_isactive: user.user_isactive !== undefined ? user.user_isactive : user.isActive
    };
  }
}
