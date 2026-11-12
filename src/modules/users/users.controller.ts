import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  UsersQuerySchema,
  UserInviteSchema,
  UserUpdateSchema,
  UserStatusSchema,
  UsersQueryDto,
  UserInviteDto,
  UserUpdateDto,
  UserStatusDto,
} from './dto/users.dto';
import { AcceptInviteSchema, AcceptInviteDto } from '../auth/dto/auth.dto';
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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Endpoint('USERS_LIST')
  @Get('/users')
  async getUsers(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<UsersQueryDto>(UsersQuerySchema, query);
    return this.usersService.getUsers(user.tenantId, queryDto);
  }

  @Endpoint('USER_INVITE')
  @Post('/users/invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<UserInviteDto>(UserInviteSchema, body);
    return this.usersService.inviteUser(user.tenantId, dto);
  }

  @Endpoint('USER_UPDATE')
  @Put('/users/:userId')
  async updateUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<UserUpdateDto>(UserUpdateSchema, body);
    return this.usersService.updateUser(user.tenantId, userId, dto);
  }

  @Endpoint('USER_STATUS')
  @Patch('/users/:userId/status')
  async updateUserStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<UserStatusDto>(UserStatusSchema, body);
    return this.usersService.updateUserStatus(user.tenantId, userId, dto);
  }

  @Endpoint('USER_RESET_PASSWORD')
  @Post('/users/:userId/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
  ) {
    return this.usersService.triggerPasswordReset(user.tenantId, userId);
  }

  @Public()
  @Endpoint('INVITE_ACCEPT')
  @Post('/auth/accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Body() body: unknown) {
    const dto = validate<AcceptInviteDto>(AcceptInviteSchema, body);
    return this.usersService.acceptInvite(dto);
  }
}

