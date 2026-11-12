import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  LoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
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
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Endpoint('AUTH_LOGIN')
  @Post('/auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const dto = validate<LoginDto>(LoginSchema, body);
    return this.authService.login(dto);
  }

  @Public()
  @Endpoint('AUTH_REFRESH')
  @Post('/auth/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown) {
    const dto = validate<RefreshTokenDto>(RefreshTokenSchema, body);
    return this.authService.refresh(dto);
  }

  @Endpoint('AUTH_LOGOUT')
  @Post('/auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body() body: unknown,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const dto = validate<LogoutDto>(LogoutSchema, body || {});
    await this.authService.logout(dto, user?.userId);
  }

  @Endpoint('AUTH_ME')
  @Get('/auth/me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.me(user.userId, user.tenantId);
  }

  @Public()
  @Endpoint('AUTH_FORGOT_PASSWORD')
  @Post('/auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: unknown) {
    const dto = validate<ForgotPasswordDto>(ForgotPasswordSchema, body);
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Endpoint('AUTH_RESET_PASSWORD')
  @Post('/auth/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown) {
    const dto = validate<ResetPasswordDto>(ResetPasswordSchema, body);
    return this.authService.resetPassword(dto);
  }

  @Endpoint('AUTH_CHANGE_PASSWORD')
  @Post('/auth/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<ChangePasswordDto>(ChangePasswordSchema, body);
    return this.authService.changePassword(user.userId, dto);
  }

  @Endpoint('AUTH_UPDATE_PROFILE')
  @Put('/auth/profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<UpdateProfileDto>(UpdateProfileSchema, body);
    return this.authService.updateProfile(user.userId, dto);
  }
}

