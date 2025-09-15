import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('addresses')
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer une nouvelle adresse' })
  @ApiResponse({ status: 201, description: 'Adresse créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateAddressDto })
  create(@Body() createAddressDto: CreateAddressDto) {
    // Conversion du DTO en format Prisma
    const prismaData: Prisma.AddressCreateInput = {
      adress_street: createAddressDto.street,
      adress_compladress: createAddressDto.complement,
      adress_zipcode: createAddressDto.zipcode,
      adress_city: createAddressDto.city,
      // Note: Il n'y a pas de champ country dans le schéma Prisma
    };

    return this.addressService.create(prismaData);
  }

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer toutes les adresses' })
  @ApiResponse({
    status: 200,
    description: 'Liste des adresses récupérée avec succès',
  })
  findAll() {
    return this.addressService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer une adresse par ID' })
  @ApiResponse({ status: 200, description: 'Adresse récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  @ApiParam({ name: 'id', description: "ID de l'adresse" })
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour une adresse' })
  @ApiResponse({ status: 200, description: 'Adresse mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  @ApiParam({ name: 'id', description: "ID de l'adresse" })
  @ApiBody({ type: UpdateAddressDto })
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    const prismaData: Prisma.AddressUpdateInput = {};

    if (updateAddressDto.street !== undefined)
      prismaData.adress_street = updateAddressDto.street;
    if (updateAddressDto.complement !== undefined)
      prismaData.adress_compladress = updateAddressDto.complement;
    if (updateAddressDto.zipcode !== undefined)
      prismaData.adress_zipcode = updateAddressDto.zipcode;
    if (updateAddressDto.city !== undefined)
      prismaData.adress_city = updateAddressDto.city;
    // Note: Pas de mise à jour du country car le champ n'existe pas dans le schéma

    return this.addressService.update(id, prismaData);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  @ApiResponse({ status: 200, description: 'Adresse supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  @ApiParam({ name: 'id', description: "ID de l'adresse" })
  remove(@Param('id') id: string) {
    return this.addressService.delete(id);
  }
}
