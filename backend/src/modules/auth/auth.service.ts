import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OtpPurpose, UserRoleStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterCustomerDto,
  RegisterDeliveryPartnerDto,
  RegisterRestaurantOwnerDto,
  RegisterRoleDto,
  RegisterStaffDto,
  ResetPasswordDto,
  SendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_SALT_ROUNDS = 10;
const OTP_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateReferralCode(): string {
    return 'OFOS' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private async createSession(
    userId: bigint,
    reqMeta?: { ipAddress?: string; userAgent?: string; deviceName?: string },
  ) {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session

    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: reqMeta?.ipAddress || null,
        userAgent: reqMeta?.userAgent || null,
        deviceName: reqMeta?.deviceName || null,
        expiresAt,
      },
    });

    return refreshToken;
  }

  private generateAccessToken(user: { id: bigint; email: string | null; roles: string[] }) {
    return this.jwtService.sign(
      {
        id: user.id.toString(),
        email: user.email,
        roles: user.roles,
      },
      {
        expiresIn: (process.env.JWT_ACCESS_EXPIRE as any) || '1d',
      },
    );
  }

  // -------------------------------------------------------------
  // Registration Flows
  // -------------------------------------------------------------
  async registerCustomer(
    dto: RegisterCustomerDto,
    reqMeta?: { ipAddress?: string; userAgent?: string },
  ) {
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered');
      }
    }

    let referrerUserId: bigint | null = null;
    if (dto.referralCode) {
      const referrerProfile = await this.prisma.customerProfile.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrerProfile) {
        referrerUserId = referrerProfile.userId;
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          email: dto.email || null,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      const customerRole = await tx.role.findUnique({ where: { name: 'Customer' } });
      if (customerRole) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: customerRole.id,
            status: UserRoleStatus.ASSIGNED,
          },
        });
      }

      await tx.customerProfile.create({
        data: {
          userId: newUser.id,
          referralCode: this.generateReferralCode(),
          referredByUserId: referrerUserId,
        },
      });

      return newUser;
    });

    const roles = ['Customer'];
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = await this.createSession(user.id, reqMeta);

    return {
      message: 'Customer registered successfully',
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles,
        activeRole: 'Customer',
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async registerRestaurantOwner(
    dto: RegisterRestaurantOwnerDto,
    reqMeta?: { ipAddress?: string; userAgent?: string },
  ) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      const ownerRole = await tx.role.findUnique({ where: { name: 'Restaurant_owner' } });
      if (ownerRole) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: ownerRole.id,
            status: UserRoleStatus.ASSIGNED,
          },
        });
      }

      await tx.restaurant.create({
        data: {
          ownerUserId: newUser.id,
          businessName: dto.businessName,
          legalBusinessName: dto.legalBusinessName || dto.businessName,
          primaryPhone: dto.primaryPhone || dto.phone,
          primaryEmail: dto.primaryEmail || dto.email,
        },
      });

      return newUser;
    });

    const roles = ['Restaurant_owner'];
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = await this.createSession(user.id, reqMeta);

    return {
      message: 'Restaurant owner registered successfully',
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles,
        activeRole: 'Restaurant_owner',
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async registerDeliveryPartner(
    dto: RegisterDeliveryPartnerDto,
    reqMeta?: { ipAddress?: string; userAgent?: string },
  ) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      const role = await tx.role.findUnique({ where: { name: 'Delivery_partner' } });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: role.id,
            status: UserRoleStatus.ASSIGNED,
          },
        });
      }

      await tx.deliveryPartner.create({
        data: {
          userId: newUser.id,
          vehicleType: dto.vehicleType,
          vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
        },
      });

      return newUser;
    });

    const roles = ['Delivery_partner'];
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = await this.createSession(user.id, reqMeta);

    return {
      message: 'Delivery partner registered successfully',
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles,
        activeRole: 'Delivery_partner',
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async registerStaff(dto: RegisterStaffDto, reqMeta?: { ipAddress?: string; userAgent?: string }) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          email: dto.email || null,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      const role = await tx.role.findUnique({ where: { name: 'Restaurant_staff' } });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: role.id,
            status: UserRoleStatus.ASSIGNED,
          },
        });
      }

      return newUser;
    });

    const roles = ['Restaurant_staff'];
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = await this.createSession(user.id, reqMeta);

    return {
      message: 'Restaurant staff registered successfully',
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles,
        activeRole: 'Restaurant_staff',
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async registerRoleRequest(
    roleName: string,
    dto: RegisterRoleDto,
  ) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      const role = await tx.role.findUnique({ where: { name: roleName } });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: role.id,
            status: UserRoleStatus.REQUESTED, // Pending administrator verification
          },
        });
      }

      return newUser;
    });

    return {
      message: `${roleName} registration request submitted successfully. Pending verification.`,
      pendingApproval: true,
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        requestedRole: roleName,
        status: 'REQUESTED',
      },
    };
  }

  // -------------------------------------------------------------
  // Authentication & Sessions
  // -------------------------------------------------------------
  async login(dto: LoginDto, reqMeta?: { ipAddress?: string; userAgent?: string }) {
    const isEmail = dto.userIdentifier.includes('@');
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: dto.userIdentifier } : { phone: dto.userIdentifier },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials provided');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active. Please contact support.');
    }

    // Lockout check with automatic 15-minute expiration
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastFailure = Date.now() - new Date(user.updatedAt).getTime();
      if (timeSinceLastFailure < LOCKOUT_WINDOW_MS) {
        const remainingMinutes = Math.ceil((LOCKOUT_WINDOW_MS - timeSinceLastFailure) / 60000);
        throw new ForbiddenException(
          `Account temporarily locked due to too many failed attempts. Please try again after ${remainingMinutes} minute(s) or reset your password.`,
        );
      } else {
        // Lockout expired, reset counter and allow attempt
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0 },
        });
        user.failedLoginAttempts = 0;
      }
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid credentials provided');
    }

    // Reset failed login attempts and record last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    const assignedRoles = user.userRoles
      .filter((ur) => ur.status === UserRoleStatus.ASSIGNED)
      .map((ur) => ur.role.name);

    if (assignedRoles.length === 0) {
      throw new ForbiddenException('Your account role is currently pending approval.');
    }

    const primaryRole = assignedRoles[0] || 'Customer';
    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      roles: assignedRoles,
    });
    const refreshToken = await this.createSession(user.id, reqMeta);

    return {
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        roles: assignedRoles,
        activeRole: primaryRole,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async getMe(userId: bigint, activeRoleCookie?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        customerProfile: true,
        ownedRestaurants: {
          select: { id: true, businessName: true, status: true },
        },
        deliveryPartner: {
          select: { userId: true, isOnline: true, status: true, vehicleType: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const assignedRoles = user.userRoles
      .filter((ur) => ur.status === UserRoleStatus.ASSIGNED)
      .map((ur) => ur.role.name);

    const permissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      if (ur.status === UserRoleStatus.ASSIGNED) {
        ur.role.rolePermissions.forEach((rp) => {
          permissions.add(rp.permission.code);
        });
      }
    });

    const activeRole =
      activeRoleCookie && assignedRoles.includes(activeRoleCookie)
        ? activeRoleCookie
        : assignedRoles[0] || 'Customer';

    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      roles: assignedRoles,
      activeRole,
      permissions: Array.from(permissions),
      customerProfile: user.customerProfile,
      restaurants: user.ownedRestaurants,
      deliveryPartner: user.deliveryPartner,
    };
  }

  async refreshTokens(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.user || session.user.deletedAt || session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const assignedRoles = session.user.userRoles
      .filter((ur) => ur.status === UserRoleStatus.ASSIGNED)
      .map((ur) => ur.role.name);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    const accessToken = this.generateAccessToken({
      id: session.user.id,
      email: session.user.email,
      roles: assignedRoles,
    });

    return {
      accessToken,
      user: {
        id: session.user.id.toString(),
        email: session.user.email,
        roles: assignedRoles,
      },
    };
  }

  async logout(userId?: bigint, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const refreshTokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.userSession.updateMany({
        where: { refreshTokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      await this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async selectRole(userId: bigint, targetRole: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: targetRole },
        status: UserRoleStatus.ASSIGNED,
      },
    });

    if (!userRole) {
      throw new ForbiddenException(`You do not have active access to role: ${targetRole}`);
    }

    return {
      message: `Active role switched to ${targetRole}`,
      activeRole: targetRole,
    };
  }

  // -------------------------------------------------------------
  // Availability Checks
  // -------------------------------------------------------------
  async checkPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return { available: !user, message: user ? 'Phone number is in use' : 'Phone is available' };
  }

  async checkEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return { available: !user, message: user ? 'Email address is in use' : 'Email is available' };
  }

  // -------------------------------------------------------------
  // OTP Management
  // -------------------------------------------------------------
  async sendOtp(dto: SendOtpDto) {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Either phone or email must be provided');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone || null,
        email: dto.email || null,
        otpHash,
        purpose: dto.purpose,
        expiresAt,
      },
    });

    return {
      message: `OTP sent successfully to ${dto.phone || dto.email}`,
      simulatedOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Either phone or email must be provided');
    }

    const where: any = {
      purpose: dto.purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    };
    if (dto.phone) where.phone = dto.phone;
    if (dto.email) where.email = dto.email;

    const records = await this.prisma.otpVerification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let matchedRecord: (typeof records)[0] | null = null;
    for (const record of records) {
      const isMatch = await bcrypt.compare(dto.otp, record.otpHash);
      if (isMatch) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.otpVerification.update({
      where: { id: matchedRecord.id },
      data: { verifiedAt: new Date() },
    });

    // If user exists, mark verified flag
    if (dto.phone) {
      await this.prisma.user.updateMany({
        where: { phone: dto.phone },
        data: { phoneVerified: true },
      });
    }
    if (dto.email) {
      await this.prisma.user.updateMany({
        where: { email: dto.email },
        data: { emailVerified: true },
      });
    }

    return { message: 'OTP verified successfully' };
  }

  // -------------------------------------------------------------
  // Password Management
  // -------------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    const isEmail = dto.userIdentifier.includes('@');
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: dto.userIdentifier } : { phone: dto.userIdentifier },
    });

    const genericMsg = 'If an account exists, instructions have been sent to your registered contact.';

    if (!user) {
      return { message: genericMsg };
    }

    if (isEmail && user.email) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = this.hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.otpVerification.create({
        data: {
          email: user.email,
          otpHash: hashedToken,
          purpose: OtpPurpose.PASSWORD_RESET,
          expiresAt,
        },
      });

      return {
        message: genericMsg,
        simulatedResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
      };
    } else {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.otpVerification.create({
        data: {
          phone: user.phone,
          otpHash,
          purpose: OtpPurpose.PASSWORD_RESET,
          expiresAt,
        },
      });

      return {
        message: genericMsg,
        simulatedOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      };
    }
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    const isOtp = token.length === 6 && /^\d+$/.test(token);

    let user: any = null;

    if (isOtp) {
      if (!dto.userIdentifier) {
        throw new BadRequestException('Phone number is required when resetting via OTP');
      }

      const records = await this.prisma.otpVerification.findMany({
        where: {
          phone: dto.userIdentifier,
          purpose: OtpPurpose.PASSWORD_RESET,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      let validRecord: any = null;
      for (const rec of records) {
        if (await bcrypt.compare(token, rec.otpHash)) {
          validRecord = rec;
          break;
        }
      }

      if (!validRecord) {
        throw new BadRequestException('Invalid or expired reset OTP');
      }

      await this.prisma.otpVerification.update({
        where: { id: validRecord.id },
        data: { verifiedAt: new Date() },
      });

      user = await this.prisma.user.findFirst({ where: { phone: dto.userIdentifier } });
    } else {
      const hashedToken = this.hashToken(token);
      const record = await this.prisma.otpVerification.findFirst({
        where: {
          otpHash: hashedToken,
          purpose: OtpPurpose.PASSWORD_RESET,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record || !record.email) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      });

      user = await this.prisma.user.findFirst({ where: { email: record.email } });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      const isSame = await bcrypt.compare(dto.password, user.passwordHash);
      if (isSame) {
        throw new BadRequestException('New password must be different from current password');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, failedLoginAttempts: 0 },
    });

    // Revoke all sessions on password reset
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: bigint, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const isSame = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSame) {
      throw new BadRequestException('New password cannot be identical to current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, PASSWORD_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  // -------------------------------------------------------------
  // Profile & Session Management
  // -------------------------------------------------------------
  async updateProfile(userId: bigint, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        profileImageUrl: dto.profileImageUrl,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: {
        id: updated.id.toString(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        profileImageUrl: updated.profileImageUrl,
      },
    };
  }

  async getSessions(userId: bigint) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id.toString(),
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: bigint, sessionId: bigint) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already revoked');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  async deleteAccount(userId: bigint) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });

    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Account deleted successfully' };
  }
}
