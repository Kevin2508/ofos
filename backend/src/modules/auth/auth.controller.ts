import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CheckEmailDto,
  CheckPhoneDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterCustomerDto,
  RegisterDeliveryPartnerDto,
  RegisterRestaurantOwnerDto,
  RegisterRoleDto,
  RegisterStaffDto,
  ResetPasswordDto,
  SelectRoleDto,
  SendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }, activeRole?: string) {
    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    if (activeRole) {
      res.cookie('activeRole', activeRole, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.clearCookie('activeRole', { path: '/' });
  }

  // -------------------------------------------------------------
  // Registration Endpoints
  // -------------------------------------------------------------
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerCustomer(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setAuthCookies(res, result.tokens, result.user.activeRole);
    return result;
  }

  @Post('register/restaurant-owner')
  @ApiOperation({ summary: 'Register a new restaurant owner' })
  async registerRestaurantOwner(
    @Body() dto: RegisterRestaurantOwnerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerRestaurantOwner(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setAuthCookies(res, result.tokens, result.user.activeRole);
    return result;
  }

  @Post('register/delivery-partner')
  @ApiOperation({ summary: 'Register a new delivery rider' })
  async registerDeliveryPartner(
    @Body() dto: RegisterDeliveryPartnerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerDeliveryPartner(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setAuthCookies(res, result.tokens, result.user.activeRole);
    return result;
  }

  @Post('register/restaurant-staff')
  @ApiOperation({ summary: 'Register restaurant staff' })
  async registerStaff(
    @Body() dto: RegisterStaffDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerStaff(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setAuthCookies(res, result.tokens, result.user.activeRole);
    return result;
  }

  @Post('register/admin')
  @ApiOperation({ summary: 'Request administrator registration (pending approval)' })
  async registerAdmin(
    @Body() dto: RegisterRoleDto,
  ) {
    // Admin registration assigns REQUESTED status and does not issue immediate tokens
    return this.authService.registerRoleRequest('Admin', dto);
  }

  @Post('register/fleet-manager')
  @ApiOperation({ summary: 'Request fleet manager registration (pending approval)' })
  async registerFleetManager(
    @Body() dto: RegisterRoleDto,
  ) {
    return this.authService.registerRoleRequest('Fleet_manager', dto);
  }

  @Post('register/finance-manager')
  @ApiOperation({ summary: 'Request finance manager registration (pending approval)' })
  async registerFinanceManager(
    @Body() dto: RegisterRoleDto,
  ) {
    return this.authService.registerRoleRequest('Finance_manager', dto);
  }

  // -------------------------------------------------------------
  // Login & Session Endpoints
  // -------------------------------------------------------------
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email/phone and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setAuthCookies(res, result.tokens, result.user.activeRole);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current authenticated user profile & roles' })
  async getMe(@CurrentUser() user: any, @Req() req: Request) {
    const activeRoleCookie = req.cookies?.activeRole;
    return this.authService.getMe(BigInt(user.id), activeRoleCookie);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.authService.refreshTokens(rawRefreshToken);
    res.cookie('accessToken', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Log out user and invalidate session' })
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refreshToken;
    const result = await this.authService.logout(BigInt(user.id), rawRefreshToken);
    this.clearAuthCookies(res);
    return result;
  }

  @Post('select-role')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Switch active operational role' })
  async selectRole(
    @CurrentUser() user: any,
    @Body() dto: SelectRoleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.selectRole(BigInt(user.id), dto.role);
    res.cookie('activeRole', dto.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  // -------------------------------------------------------------
  // Validation & Availability Checks
  // -------------------------------------------------------------
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if phone number is available' })
  async checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto.phone);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if email is available' })
  async checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto.email);
  }

  // -------------------------------------------------------------
  // OTP Endpoints
  // -------------------------------------------------------------
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for login, register, or password reset' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify submitted OTP code' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // -------------------------------------------------------------
  // Password Management
  // -------------------------------------------------------------
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link or OTP' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password/:resetToken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token or OTP' })
  async resetPassword(
    @Param('resetToken') token: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current account password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(BigInt(user.id), dto);
  }

  // -------------------------------------------------------------
  // Profile & Sessions
  // -------------------------------------------------------------
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update profile information' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(BigInt(user.id), dto);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List all active user sessions' })
  async getSessions(@CurrentUser() user: any) {
    return this.authService.getSessions(BigInt(user.id));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Revoke a specific user session' })
  async revokeSession(
    @CurrentUser() user: any,
    @Param('id') sessionId: string,
  ) {
    if (!/^\d+$/.test(sessionId)) {
      throw new BadRequestException('Invalid session ID format. Must be numeric.');
    }
    return this.authService.revokeSession(BigInt(user.id), BigInt(sessionId));
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Soft delete current user account' })
  async deleteAccount(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(BigInt(user.id));
    this.clearAuthCookies(res);
    return result;
  }
}
