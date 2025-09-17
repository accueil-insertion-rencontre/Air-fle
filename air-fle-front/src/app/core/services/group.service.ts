import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { Student, Session } from '../models';
import { ApiListResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;



  constructor(private http: HttpClient) {}

  getGroups(): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<ApiListResponse<Group> | {data: {data: Group[]}} | Group[] | Record<string, unknown>>(this.apiUrl).pipe(
      tap((response: ApiListResponse<Group> | {data: {data: Group[]}} | Group[] | Record<string, unknown>) => {
      }),
      map((response: ApiListResponse<Group> | {data: {data: Group[]}} | Group[] | Record<string, unknown>) => {
        if (response && Array.isArray((response as Record<string, unknown>)['data'])) return ((response as Record<string, unknown>)['data'] as Record<string, unknown>[]).map(g => this.convertToFrontendModel(g));
        if (response && (response as Record<string, unknown>)['data'] && Array.isArray(((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'])) return (((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'] as Record<string, unknown>[]).map(g => this.convertToFrontendModel(g));
        if (Array.isArray(response)) return (response as Record<string, unknown>[]).map(g => this.convertToFrontendModel(g));
        if (response && ((response as Record<string, unknown>)['id'] || (response as Record<string, unknown>)['group_id'])) return [this.convertToFrontendModel(response as Record<string, unknown>)];
        return [];
      }),
      catchError(this.handleError)
    );
  }

  getGroupsBySessionId(sessionId: number): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<ApiListResponse<Group> | {data: {data: Group[]}} | Group[] | Record<string, unknown>>(`${this.apiUrl}/session/${sessionId}`).pipe(

      map((response: ApiListResponse<Group> | {data: {data: Group[]}} | Group[] | Record<string, unknown>) => {
        // Structure spécifique de votre API: response.data.data contient le tableau OU response.data contient directement le tableau
        if (response && (response as Record<string, unknown>)['data'] && ((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'] && Array.isArray(((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'])) {
          return (((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'] as Record<string, unknown>[]).map((group: Record<string, unknown>) => this.convertToFrontendModel(group));
        }
        // Si response.data contient directement le tableau
        else if (response && (response as Record<string, unknown>)['data'] && Array.isArray((response as Record<string, unknown>)['data'])) {
          return ((response as Record<string, unknown>)['data'] as Record<string, unknown>[]).map((group: Record<string, unknown>) => this.convertToFrontendModel(group));
        }
        // Vérifier si la réponse est un tableau directement
        else if (Array.isArray(response)) {
          return (response as unknown as Record<string, unknown>[]).map((group: Record<string, unknown>) => this.convertToFrontendModel(group));
        }
        // Vérifier si la réponse est un objet avec une propriété data ou items
        else if (response && ((response as Record<string, unknown>)['data'] || (response as Record<string, unknown>)['items'])) {
          const groupsData = (response as Record<string, unknown>)['data'] || (response as Record<string, unknown>)['items'];
          if (Array.isArray(groupsData)) {
            return groupsData.map((group: Record<string, unknown>) => this.convertToFrontendModel(group));
          }
        }
        // Si c'est un objet unique, le mettre dans un tableau
        else if (response && ('id' in response || 'group_id' in response)) {
          return [this.convertToFrontendModel(response)];
        }

        return [];
      }),
      catchError(this.handleError)
    );
  }

  getGroupById(id: string | number): Observable<Group> {
    // En production, utiliser l'API réelle
    return this.http.get<{data: Group} | Group>(`${this.apiUrl}/${id}`).pipe(

      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && 'data' in response) {
          return this.convertToFrontendModel((response as {data: Record<string, unknown>}).data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && ('id' in response || 'group_id' in response)) {
          return this.convertToFrontendModel(response as unknown as Record<string, unknown>);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );
  }

  createGroup(group: Partial<Group>): Observable<Group> {
    
    
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiGroup = this.convertToApiModel(group);
    

    // Envoyer à l'API
    return this.http.post<{data: Group} | Group>(this.apiUrl, apiGroup).pipe(

      map(response => {
        
        
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && 'data' in response) {
          const result = this.convertToFrontendModel((response as {data: Record<string, unknown>}).data);
          
          return result;
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && ('id' in response || 'group_id' in response)) {
          const result = this.convertToFrontendModel(response as unknown as Record<string, unknown>);
          
          return result;
        }

        // console.error('❌ GROUP-SERVICE - Format de réponse API inattendu:', response);
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
    return this.http.patch<{data: Group} | Group>(`${this.apiUrl}/${id}`, apiGroup).pipe(

      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet groupe
        if (response && 'data' in response) {
          return this.convertToFrontendModel((response as {data: Record<string, unknown>}).data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && ('id' in response || 'group_id' in response)) {
          return this.convertToFrontendModel(response as unknown as Record<string, unknown>);
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



  private handleError(error: Error): Observable<never> {
    // console.error('Une erreur est survenue', error);
    return throwError(() => error);
  }

  // Convertir un modèle de groupe de l'API (camelCase) vers le format frontend (snake_case)
  private convertToFrontendModel(apiGroup: Record<string, unknown>): Group {
    if (!apiGroup) {
      return {} as Group;
    }



    // L'objet apiGroup contient maintenant directement les données du groupe
    const groupId = apiGroup['group_uuid'] || apiGroup['id'] || apiGroup['groupId'] || apiGroup['group_id'] || 0;
    const sessionId = apiGroup['session_uuid'] || apiGroup['session_id'] || apiGroup['sessionId'];

    // Traitement spécial pour les étudiants avec la structure Prisma
    let students: Student[] = [];
    if (apiGroup['students'] && Array.isArray(apiGroup['students'])) {
      students = (apiGroup['students'] as Record<string, unknown>[]).map((studentRelation) => {
        // Structure Prisma: { student: { id, firstname, lastname, ... } }
        const rel = studentRelation as Record<string, unknown>;
        if (rel['student']) {
          const student = rel['student'] as Record<string, unknown>;
          return {
            // ✅ UTILISER EXACTEMENT LES CHAMPS DE L'API PRISMA
            student_uuid: student['student_uuid'],
            student_firstname: student['student_firstname'],
            student_lastname: student['student_lastname'],
            student_mail: student['student_mail'],
            // Copier toutes les autres propriétés
            ...student,
          } as Student;
        }
        // Si la structure est déjà plate (cas de fallback)
        else if (rel['student_uuid'] || rel['student_id']) {
          return {
            student_uuid: rel['student_uuid'] || rel['student_id'],
            student_firstname: rel['student_firstname'],
            student_lastname: rel['student_lastname'],
            student_mail: rel['student_mail'],
            ...rel,
          } as Student;
        } else {
          return rel as unknown as Student;
        }
      });
    }

    const convertedGroup: Group = {
      group_id: groupId as string | number,
      label: (apiGroup['group_label'] || apiGroup['label'] || '') as string,
      // Convertir les nouveaux champs API vers le format frontend
      session_id: sessionId as string | number | undefined,
      started_at: apiGroup['group_started_at'] || apiGroup['startedAt'] ? new Date((apiGroup['group_started_at'] || apiGroup['startedAt']) as string) : undefined,
      ended_at: apiGroup['group_ended_at'] || apiGroup['endedAt'] ? new Date((apiGroup['group_ended_at'] || apiGroup['endedAt']) as string) : undefined,
      more_info: (apiGroup['group_more_info'] || apiGroup['moreInfo'] || apiGroup['more_info']) as string | undefined,
      external_id: (apiGroup['externalId'] || apiGroup['external_id']) as string | undefined,
      // Utiliser les étudiants traités
      students: students,
      session: apiGroup['session'] as Session | undefined,
      // Ajouter également les propriétés camelCase pour compatibilité
      sessionId: sessionId as string | number | undefined,
      startedAt: (apiGroup['group_started_at'] || apiGroup['startedAt']) as string | undefined,
      endedAt: (apiGroup['group_ended_at'] || apiGroup['endedAt']) as string | undefined,
      moreInfo: (apiGroup['group_more_info'] || apiGroup['moreInfo'] || apiGroup['more_info']) as string | undefined,
      externalId: (apiGroup['externalId'] || apiGroup['external_id']) as string | undefined,
    };



    return convertedGroup;
  }

  // Convertir un modèle de groupe du frontend vers le format API
  private convertToApiModel(group: Partial<Group>): Record<string, unknown> {
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
