import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    const { user_password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findOne(id: string) {
    return this.userRepository.findWithoutPassword(id);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};

    const [users, total] = await Promise.all([
      this.userRepository.findManyWithoutPasswords({
        skip,
        take,
        where,
        orderBy,
        include: { role: true, courses: true },
      }),
      this.userRepository.count(where),
    ]);

    return {
      data: users,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
  }

  async create(data: {
    user_firstname: string;
    user_lastname: string;
    user_mail: string;
    user_password: string;
    role_uuid: string;
    user_isactive?: boolean;
    user_birthdate?: string;
  }) {
    // Vérifier si l'utilisateur existe déjà
    const emailExists = await this.userRepository.emailExists(data.user_mail);
    if (emailExists) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe avec argon2
    const hashedPassword = await argon2.hash(data.user_password);

    // Préparer les données de l'utilisateur
    const userData: Prisma.UserCreateInput = {
      user_firstname: data.user_firstname,
      user_lastname: data.user_lastname,
      user_mail: data.user_mail,
      user_password: hashedPassword,
      user_birthdate: data.user_birthdate
        ? new Date(data.user_birthdate)
        : null,
      user_isactive: data.user_isactive ?? true,
      role: {
        connect: {
          role_uuid: data.role_uuid,
        },
      },
    };

    // Créer l'utilisateur
    const user = await this.userRepository.create(userData);

    this.logger.log(
      JSON.stringify({
        event: 'user_created',
        user_uuid: user.user_uuid,
        email: user.user_mail,
        role_uuid: data.role_uuid,
      }),
    );

    // Ne pas retourner le mot de passe
    const { user_password, ...result } = user;
    return result;
  }

  async update(
    id: string,
    data: {
      user_firstname?: string;
      user_lastname?: string;
      user_mail?: string;
      user_password?: string;
      role_uuid?: string;
      user_birthdate?: string;
    },
  ) {
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.UserUpdateInput = {};

      if (data.user_firstname) updateData.user_firstname = data.user_firstname;
      if (data.user_lastname) updateData.user_lastname = data.user_lastname;
      if (data.user_mail) {
        // Vérifier l'unicité de l'email
        const emailExists = await this.userRepository.emailExists(
          data.user_mail,
          id,
        );
        if (emailExists) {
          throw new ConflictException(
            'Un utilisateur avec cet email existe déjà',
          );
        }
        updateData.user_mail = data.user_mail;
      }
      if (data.user_birthdate)
        updateData.user_birthdate = new Date(data.user_birthdate);

      // Si le mot de passe est fourni, le hasher avec argon2
      if (data.user_password) {
        updateData.user_password = await argon2.hash(data.user_password);
      }

      // Si le rôle est fourni
      if (data.role_uuid) {
        updateData.role = {
          connect: { role_uuid: data.role_uuid },
        };
      }

      const updatedUser = await this.userRepository.update(id, updateData);
      this.logger.log(
        JSON.stringify({
          event: 'user_updated',
          user_uuid: updatedUser.user_uuid,
          email: updatedUser.user_mail,
        }),
      );

      // Ne pas retourner le mot de passe
      const { user_password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      this.logger.error(
        JSON.stringify({
          event: 'user_update_failed',
          user_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Vérifier d'abord si l'utilisateur à supprimer existe
      const userToDelete = await this.userRepository.findById(id);

      if (!userToDelete) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Si c'est un administrateur, vérifier s'il y a d'autres administrateurs
      if (userToDelete.role && userToDelete.role.role_name === 'admin') {
        const adminCount = await this.userRepository.countByRole('admin');

        if (adminCount <= 1) {
          throw new UnauthorizedException(
            'Impossible de supprimer le dernier administrateur du système',
          );
        }
      }

      await this.userRepository.delete(id);
      this.logger.log(JSON.stringify({ event: 'user_deleted', user_uuid: id }));
      return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      this.logger.error(
        JSON.stringify({
          event: 'user_delete_failed',
          user_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  // Méthodes utilitaires pour l'authentification
  async findByEmailWithPassword(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByIdWithPassword(id: string) {
    return this.userRepository.findById(id);
  }

  async updatePasswordChangeTimestamp(userId: string): Promise<void> {
    // Marquer le changement de mot de passe (pour l'instant juste une update simple)
    await this.userRepository.update(userId, {});
  }

  async updateUserStatus(id: string, isActive: boolean) {
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Mettre à jour le statut
      const updatedUser = await this.userRepository.update(id, {
        user_isactive: isActive,
      });
      this.logger.log(
        JSON.stringify({
          event: 'user_status_updated',
          user_uuid: updatedUser.user_uuid,
          isActive,
        }),
      );

      // Ne pas retourner le mot de passe
      const { user_password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      this.logger.error(
        JSON.stringify({
          event: 'user_status_update_failed',
          user_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }
}
