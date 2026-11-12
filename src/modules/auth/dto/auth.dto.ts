import { z } from 'zod';

export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Identifier (email or phone) is required'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutDto = z.infer<typeof LogoutSchema>;

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or identifier is required'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AcceptInviteDto = z.infer<typeof AcceptInviteSchema>;

