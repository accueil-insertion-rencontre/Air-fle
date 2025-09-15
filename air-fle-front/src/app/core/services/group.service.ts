import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { ApiListResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;



  constructor(private http: HttpClient) {}

  getGroups(): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('🔍 GroupService: Réponse API brute:', response);
        console.log('🔍 GroupService: URL appelée:', this.apiUrl);
      }),
      map((response: ApiListResponse<Group> | any) => {
        if (response && Array.isArray(response.data)) return (response.data as any[]).map(g => this.convertToFrontendModel(g));
        if (response && response.data && Array.isArray(response.data.data)) return (response.data.data as any[]).map(g => this.convertToFrontendModel(g));
        if (Array.isArray(response)) return (response as any[]).map(g => this.convertToFrontendModel(g));
        if (response && (response.id || response.group_id)) return [this.convertToFrontendModel(response)];
        return [];
      }),
      catchError(this.handleError)
    );
  }

  getGroupsBySessionId(sessionId: number): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`).pipe(

      map((response: ApiListResponse<Group> | any) => {
        // Structure spécifique de votre API: response.data.data contient le tableau OU response.data contient directement le tableau
        if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((group: any) => this.convertToFrontendModel(group));
        }
        // Si response.data contient directement le tableau
        else if (response && response.data && Array.isArray(response.data)) {
          return response.data.map((group: any) => this.convertToFrontendModel(group));
        }
        // Vérifier si la réponse est un tableau directement
        else if (Array.isArray(response)) {
          return response.map((group: any) => this.convertToFrontendModel(group));
        }
        // Vérifier si la réponse est un objet avec une propriété data ou items
        else if (response && (response.data || response.items)) {
          const groupsData = response.data || response.items;
          if (Array.isArray(groupsData)) {
            return groupsData.map((group: any) => this.convertToFrontendModel(group));
          }
        }
        // Si c'est un objet unique, le mettre dans un tableau
        else if (response && (response.id || response.group_id)) {
          return [this.convertToFrontendModel(response)];
        }

        return [];
      }),
      catchError(this.handleError)
    );
  }

  getGroupById(id: string | number): Observable<Group> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(

      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response.id || response.group_id)) {
          return this.convertToFrontendModel(response);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );
  }

  createGroup(group: any): Observable<Group> {
    
    
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiGroup = this.convertToApiModel(group);
    

    // Envoyer à l'API
    return this.http.post<any>(this.apiUrl, apiGroup).pipe(

      map(response => {
        
        
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && response.data) {
          const result = this.convertToFrontendModel(response.data);
          
          return result;
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response.id || response.group_id)) {
          const result = this.convertToFrontendModel(response);
          
          return result;
        }

        console.error('❌ GROUP-SERVICE - Format de réponse API inattendu:', response);
        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );

    // Pour les tests, simuler la création
    // const newGroup: Group = {
    //   ...group,
    //   group_id: this.getNextId(),
    //   students: []
    // };
    //
    // this.mockGroups.push(newGroup);
    // return of(newGroup);
  }

  updateGroup(id: string | number, group: Partial<Group>): Observable<Group> {
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiGroup = this.convertToApiModel(group);

    // Envoyer à l'API
    return this.http.put<any>(`${this.apiUrl}/${id}`, apiGroup).pipe(

      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response.id || response.group_id)) {
          return this.convertToFrontendModel(response);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );

    // Pour les tests, simuler la mise à jour
    // const index = this.mockGroups.findIndex(g => g.group_id === id);
    // if (index !== -1) {
    //   const updatedGroup = {
    //     ...this.mockGroups[index],
    //     ...group,
    //     group_id: id
    //   };
    //   this.mockGroups[index] = updatedGroup;
    //   return of(updatedGroup);
    // }
    // return throwError(() => new Error(`Groupe avec l'ID ${id} non trouvé`));
  }

  deleteGroup(id: string | number): Observable<void> {
    // En production, utiliser l'API réelle
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));

    // Pour les tests, simuler la suppression
    // const index = this.mockGroups.findIndex(g => g.group_id === id);
    // if (index !== -1) {
    //   this.mockGroups.splice(index, 1);
    //   return of(undefined);
    // }
    // return throwError(() => new Error(`Groupe avec l'ID ${id} non trouvé`));
  }



  private handleError(error: any): Observable<never> {
    console.error('Une erreur est survenue', error);
    return throwError(() => error);
  }

  // Convertir un modèle de groupe de l'API (camelCase) vers le format frontend (snake_case)
  private convertToFrontendModel(apiGroup: any): Group {
    if (!apiGroup) {
      console.warn('Groupe API vide ou null');
      return {} as Group;
    }



    // L'objet apiGroup contient maintenant directement les données du groupe
    const groupId = apiGroup.group_uuid || apiGroup.id || apiGroup.groupId || apiGroup.group_id || 0;
    const sessionId = apiGroup.session_uuid || apiGroup.session_id || apiGroup.sessionId;

    // Traitement spécial pour les étudiants avec la structure Prisma
    let students: any[] = [];
    if (apiGroup.students && Array.isArray(apiGroup.students)) {
      students = apiGroup.students.map((studentRelation: any) => {
        // Structure Prisma: { student: { id, firstname, lastname, ... } }
        if (studentRelation.student) {
          return {
            // ✅ UTILISER EXACTEMENT LES CHAMPS DE L'API PRISMA
            student_uuid: studentRelation.student.student_uuid,
            student_firstname: studentRelation.student.student_firstname,
            student_lastname: studentRelation.student.student_lastname,
            student_mail: studentRelation.student.student_mail,
            // Copier toutes les autres propriétés
            ...studentRelation.student,
          };
        }
        // Si la structure est déjà plate (cas de fallback)
        else if (studentRelation.student_uuid || studentRelation.student_id) {
          return {
            student_uuid: studentRelation.student_uuid || studentRelation.student_id,
            student_firstname: studentRelation.student_firstname,
            student_lastname: studentRelation.student_lastname,
            student_mail: studentRelation.student_mail,
            ...studentRelation,
          };
        } else {
          return studentRelation;
        }
      });
    }

    const convertedGroup = {
      group_id: groupId,
      label: apiGroup.group_label || apiGroup.label || '',
      // Convertir les nouveaux champs API vers le format frontend
      session_id: sessionId,
      started_at: apiGroup.group_started_at || apiGroup.startedAt ? new Date(apiGroup.group_started_at || apiGroup.startedAt) : undefined,
      ended_at: apiGroup.group_ended_at || apiGroup.endedAt ? new Date(apiGroup.group_ended_at || apiGroup.endedAt) : undefined,
      more_info: apiGroup.group_more_info || apiGroup.moreInfo || apiGroup.more_info,
      external_id: apiGroup.externalId || apiGroup.external_id,
      // Utiliser les étudiants traités
      students: students,
      session: apiGroup.session,
      // Ajouter également les propriétés camelCase pour compatibilité
      sessionId: sessionId,
      startedAt: apiGroup.group_started_at || apiGroup.startedAt,
      endedAt: apiGroup.group_ended_at || apiGroup.endedAt,
      moreInfo: apiGroup.group_more_info || apiGroup.moreInfo || apiGroup.more_info,
      externalId: apiGroup.externalId || apiGroup.external_id,
    };



    return convertedGroup;
  }

  // Convertir un modèle de groupe du frontend vers le format API
  private convertToApiModel(group: any): any {
    // ✅ CONVERSION VERS LES VRAIS NOMS DE CHAMPS API
    const apiData = {
      // Nouveaux champs obligatoires selon le schéma
      group_label: group.group_label || group.label,
      session_uuid: group.session_uuid || group.session_id,
      
      // Champs optionnels
      ...(group.group_started_at && { group_started_at: group.group_started_at }),
      ...(group.group_ended_at && { group_ended_at: group.group_ended_at }),
      ...(group.group_more_info && { group_more_info: group.group_more_info }),
    };


    return apiData;
  }

  // Méthode pour ajouter un étudiant au groupe
  addStudentToGroup(groupId: string | number, studentUuid: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${groupId}/students/${studentUuid}`, {});
  }

  // Méthode pour retirer un étudiant du groupe
  removeStudentFromGroup(groupId: string | number, studentUuid: string): Observable<Group> {
    return this.http.delete<Group>(`${this.apiUrl}/${groupId}/students/${studentUuid}`);
  }
}
