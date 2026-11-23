import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

const cookieOrHeaderExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

export interface JwtPayload {
  id: string;
  email: string | null;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    const rawSecret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      'ofos_jwt_access_secret_key_default';
    const secret = rawSecret.trim().replace(/^['"]|['"]$/g, '');

    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId = BigInt(payload.id);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const assignedRoles = user.userRoles
      .filter((ur) => ur.status === 'ASSIGNED')
      .map((ur) => ur.role.name);

    return {
      id: user.id.toString(),
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: assignedRoles,
    };
  }
}
