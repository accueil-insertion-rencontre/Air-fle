import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupFilters } from './interfaces/group.interface';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer un groupe' })
  @ApiResponse({ status: 201, description: 'Groupe créé avec succès' })
  @ApiBody({ type: CreateGroupDto })
  async create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.createGroup({
      group_label: createGroupDto.group_label,
      session_uuid: createGroupDto.session_uuid,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des groupes récupérée avec succès',
  })
  @ApiQuery({
    name: 'session_uuid',
    required: false,
    description: 'Filtrer par session',
  })
  @ApiQuery({
    name: 'period_uuid',
    required: false,
    description: 'Filtrer par période',
  })
  async findAll(
    @Query('session_uuid') session_uuid?: string,
    @Query('period_uuid') period_uuid?: string,
  ) {
    const filters: GroupFilters = {};

    if (session_uuid) {
      filters.session_uuid = session_uuid;
    }

    if (period_uuid) {
      filters.period_uuid = period_uuid;
    }

    return this.groupService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe par ID' })
  @ApiResponse({ status: 200, description: 'Groupe récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  async findOne(@Param('id') id: string) {
    return this.groupService.findById(id);
  }

  @Put(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un groupe' })
  @ApiResponse({ status: 200, description: 'Groupe mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  @ApiBody({ type: UpdateGroupDto })
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(id, {
      group_label: updateGroupDto.group_label,
      session_uuid: updateGroupDto.session_uuid,
    });
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un groupe' })
  @ApiResponse({ status: 200, description: 'Groupe supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  async remove(@Param('id') id: string) {
    return this.groupService.deleteGroup(id);
  }

  @Post(':id/students/:student_uuid')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Ajouter un étudiant au groupe' })
  @ApiResponse({ status: 200, description: 'Étudiant ajouté avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe ou étudiant non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  @ApiParam({ name: 'student_uuid', description: "UUID de l'étudiant" })
  async addStudent(
    @Param('id') groupId: string,
    @Param('student_uuid') student_uuid: string,
  ) {
    return this.groupService.addStudent(groupId, student_uuid);
  }

  @Delete(':id/students/:student_uuid')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Retirer un étudiant du groupe' })
  @ApiResponse({ status: 200, description: 'Étudiant retiré avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe ou étudiant non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  @ApiParam({ name: 'student_uuid', description: "UUID de l'étudiant" })
  async removeStudent(
    @Param('id') groupId: string,
    @Param('student_uuid') student_uuid: string,
  ) {
    return this.groupService.removeStudent(groupId, student_uuid);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Récupérer les étudiants du groupe' })
  @ApiResponse({ status: 200, description: 'Étudiants récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du groupe' })
  async getStudents(@Param('id') groupId: string) {
    return this.groupService.getStudentsByGroup(groupId);
  }
}
