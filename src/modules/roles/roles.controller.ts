import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RoleCreateSchema, RoleUpdateSchema, RoleCreateDto, RoleUpdateDto } from './dto/roles.dto';
import { DomainError } from '../../common/domain.error';

function validate<T>(schema: any, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new DomainError('VALIDATION_ERROR', 'Validation failed', details);
  }
  return result.data as T;
}

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Endpoint('ROLES_LIST')
  @Get('/roles')
  async getRoles(@CurrentUser() user: CurrentUserPayload) {
    return this.rolesService.getRoles(user.tenantId);
  }

  @Endpoint('ROLE_CREATE')
  @Post('/roles')
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<RoleCreateDto>(RoleCreateSchema, body);
    return this.rolesService.createRole(user.tenantId, dto);
  }

  @Endpoint('ROLE_UPDATE')
  @Put('/roles/:roleId')
  async updateRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roleId') roleId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<RoleUpdateDto>(RoleUpdateSchema, body);
    return this.rolesService.updateRole(user.tenantId, roleId, dto);
  }

  @Endpoint('ROLE_DELETE')
  @Delete('/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roleId') roleId: string,
  ) {
    await this.rolesService.deleteRole(user.tenantId, roleId);
  }

  @Endpoint('PERMISSIONS_CATALOG')
  @Get('/permissions')
  getPermissions() {
    return this.rolesService.getPermissionsCatalog();
  }
}

