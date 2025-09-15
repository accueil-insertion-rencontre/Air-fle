import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { user_uuid: id },
      include: {
        role: true,
        courses: true,
      },
    });
  }

  async findByEmail(email: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { user_mail: email },
      include: {
        role: true,
      },
    });
  }

  async findMany(params: any): Promise<any[]> {
    const { skip, take, where, orderBy, include } = params;

    return await this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: include || {
        role: true,
        courses: true,
      },
    });
  }

  async count(where?: any): Promise<number> {
    return await this.prisma.user.count({ where });
  }

  async create(data: any): Promise<any> {
    return await this.prisma.user.create({
      data,
      include: {
        role: true,
      },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return await this.prisma.user.update({
      where: { user_uuid: id },
      data,
      include: {
        role: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { user_uuid: id },
    });
  }

  async countByRole(roleName: string): Promise<number> {
    return await this.prisma.user.count({
      where: {
        role: {
          role_name: roleName,
        },
      },
    });
  }

  // Méthodes utilitaires spécifiques
  async findWithoutPassword(id: string): Promise<any> {
    const user = await this.findById(id);
    if (!user) return null;

    const { user_password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findManyWithoutPasswords(params: any): Promise<any[]> {
    const users = await this.findMany(params);

    return users.map((user) => {
      const { user_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const where: any = { user_mail: email };

    if (excludeId) {
      where.user_uuid = { not: excludeId };
    }

    const count = await this.prisma.user.count({ where });
    return count > 0;
  }
}
