import { Group, Prisma } from '@prisma/client';

export const GROUP_REPOSITORY = Symbol('IGroupRepository');
export const GROUP_STUDENT_MANAGER = Symbol('IGroupStudentManager');

// Type pour un groupe avec ses relations
export type GroupWithRelations = Prisma.GroupGetPayload<{
  include: {
    session: true;
    courses: true;
    students: {
      include: {
        student: true;
      };
    };
    periods: {
      include: {
        period: true;
      };
    };
  };
}>;

// Interface pour la persistance des groupes (Repository Pattern)
export interface IGroupRepository {
  findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.GroupWhereInput;
  }): Promise<GroupWithRelations[]>;

  findOne(id: string): Promise<GroupWithRelations | null>;
  create(data: Prisma.GroupCreateInput): Promise<Group>;
  update(id: string, data: Prisma.GroupUpdateInput): Promise<Group>;
  delete(id: string): Promise<Group>;
}

// Interface pour la gestion des étudiants dans les groupes (ISP)
export interface IGroupStudentManager {
  addStudent(groupId: string, studentId: string): Promise<any>;
  removeStudent(groupId: string, studentId: string): Promise<any>;
  getStudentsByGroup(groupId: string): Promise<any[]>;
}

// Interface pour les opérations métier sur les groupes
export interface IGroupBusinessService {
  findAll(filters?: GroupFilters): Promise<GroupWithRelations[]>;
  findById(id: string): Promise<GroupWithRelations>;
  createGroup(data: CreateGroupRequest): Promise<Group>;
  updateGroup(id: string, data: UpdateGroupRequest): Promise<Group>;
  deleteGroup(id: string): Promise<Group>;
}

// DTOs métier
export interface GroupFilters {
  session_uuid?: string;
  period_uuid?: string;
  skip?: number;
  take?: number;
}

export interface CreateGroupRequest {
  group_label: string;
  session_uuid: string;
}

export interface UpdateGroupRequest {
  group_label?: string;
  session_uuid?: string;
}
