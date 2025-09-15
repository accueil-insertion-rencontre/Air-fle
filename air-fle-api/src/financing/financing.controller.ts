import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FinancingService } from './financing.service';
import { CreateFinancingDto } from './dto/create-financing.dto';
import { UpdateFinancingDto } from './dto/update-financing.dto';
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

@Controller('financings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('financings')
@ApiBearerAuth()
export class FinancingController {
  constructor(
    @Inject(FinancingService)
    private readonly financingService: FinancingService,
  ) {}

  @Post()
  @Roles('admin', 'teacher')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({ summary: 'Créer un nouveau financement' })
  @ApiResponse({ status: 201, description: 'Financement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateFinancingDto })
  create(@Body() createFinancingDto: CreateFinancingDto) {
    const prismaData: Prisma.FinancingCreateInput = {
      financing_type: createFinancingDto.financing_type,
    };

    return this.financingService.create(prismaData);
  }

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les financements' })
  @ApiResponse({
    status: 200,
    description: 'Liste des financements récupérée avec succès',
  })
  findAll() {
    return this.financingService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un financement par ID' })
  @ApiResponse({ status: 200, description: 'Financement récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Financement non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du financement' })
  findOne(@Param('id') id: string) {
    return this.financingService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un financement' })
  @ApiResponse({
    status: 200,
    description: 'Financement mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Financement non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du financement' })
  @ApiBody({ type: UpdateFinancingDto })
  update(
    @Param('id') id: string,
    @Body() updateFinancingDto: UpdateFinancingDto,
  ) {
    const prismaData: Prisma.FinancingUpdateInput = {};

    if (updateFinancingDto.financing_type !== undefined) {
      prismaData.financing_type = updateFinancingDto.financing_type;
    }

    return this.financingService.update(id, prismaData);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer un financement' })
  @ApiResponse({ status: 200, description: 'Financement supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Financement non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du financement' })
  remove(@Param('id') id: string) {
    return this.financingService.delete(id);
  }
}
