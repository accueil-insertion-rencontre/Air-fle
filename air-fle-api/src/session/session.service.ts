import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Session } from '@prisma/client';

// Type pour une session avec ses relations
type SessionWithRelations = Prisma.SessionGetPayload<{
  include: {
    groups: true;
  };
}>;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SessionWhereInput;
    orderBy?: Prisma.SessionOrderByWithRelationInput;
  }): Promise<{
    data: SessionWithRelations[];
    meta: { total: number; skip: number; take: number };
  }> {
    const { skip, take, where, orderBy } = params || {};

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          groups: true,
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
  }

  async findOne(id: string): Promise<SessionWithRelations | null> {
    return this.prisma.session.findUnique({
      where: { session_uuid: id },
      include: {
        groups: true,
      },
    });
  }

  async create(createSessionData: Prisma.SessionCreateInput): Promise<Session> {
    const session = await this.prisma.session.create({
      data: createSessionData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'session_created',
        session_uuid: session.session_uuid,
        label: session.session_label,
      }),
    );
    return session;
  }

  async update(
    id: string,
    updateSessionData: Prisma.SessionUpdateInput,
  ): Promise<Session> {
    const session = await this.prisma.session.update({
      where: { session_uuid: id },
      data: updateSessionData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'session_updated',
        session_uuid: session.session_uuid,
      }),
    );
    return session;
  }

  async delete(id: string): Promise<Session> {
    const session = await this.prisma.session.delete({
      where: { session_uuid: id },
    });
    this.logger.log(
      JSON.stringify({
        event: 'session_deleted',
        session_uuid: session.session_uuid,
      }),
    );
    return session;
  }
}
