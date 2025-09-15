import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Address, Prisma } from '@prisma/client';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Address[]> {
    return this.prisma.address.findMany();
  }

  async findOne(id: string): Promise<Address | null> {
    return this.prisma.address.findUnique({
      where: { address_uuid: id },
    });
  }

  async create(data: Prisma.AddressCreateInput): Promise<Address> {
    try {
      const address = await this.prisma.address.create({ data });
      this.logger.log(
        JSON.stringify({
          event: 'address_created',
          address_uuid: address.address_uuid,
          city: address.adress_city,
          zipcode: address.adress_zipcode,
        }),
      );
      return address;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'address_create_failed',
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  async update(id: string, data: Prisma.AddressUpdateInput): Promise<Address> {
    try {
      const address = await this.prisma.address.update({
        where: { address_uuid: id },
        data,
      });
      this.logger.log(
        JSON.stringify({
          event: 'address_updated',
          address_uuid: address.address_uuid,
          city: address.adress_city,
        }),
      );
      return address;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'address_update_failed',
          address_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  async delete(id: string): Promise<Address> {
    try {
      const address = await this.prisma.address.delete({
        where: { address_uuid: id },
      });
      this.logger.log(
        JSON.stringify({
          event: 'address_deleted',
          address_uuid: address.address_uuid,
        }),
      );
      return address;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'address_delete_failed',
          address_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }
}
