import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Prisma.UserGetPayload<{
    include: { role: true; courses: true };
  }> | null> {
    return await this.prisma.user.findUnique({
      where: { user_uuid: id },
      include: {
        role: true,
        courses: true,
      },
    });
  }

  async findByEmail(email: string): Promise<Prisma.UserGetPayload<{
    include: { role: true };
  }> | null> {
    return await this.prisma.user.findUnique({
      where: { user_mail: email },
      include: {
        role: true,
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }): Promise<User[]> {
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

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return await this.prisma.user.count({ where });
  }

  async create(data: Prisma.UserCreateInput): Promise<
    Prisma.UserGetPayload<{
      include: { role: true; courses: true };
    }>
  > {
    return await this.prisma.user.create({
      data,
      include: {
        role: true,
        courses: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<
    Prisma.UserGetPayload<{
      include: { role: true };
    }>
  > {
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
  async findWithoutPassword(
    id: string,
  ): Promise<Omit<Prisma.UserGetPayload<{
    include: { role: true; courses: true };
  }>, 'user_password'> | null> {
    const user = await this.findById(id);
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findManyWithoutPasswords(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }): Promise<Omit<User, 'user_password'>[]> {
    const users = await this.findMany(
      params as Parameters<typeof this.findMany>[0],
    );

    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { user_mail: email };

    if (excludeId) {
      where.user_uuid = { not: excludeId };
    }

    const count = await this.prisma.user.count({ where });
    return count > 0;
  }
}
