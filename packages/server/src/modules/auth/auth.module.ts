import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthTrpc } from './auth.trpc';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES as any) || '15m',
      },
    }),
    forwardRef(() => PrismaModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthTrpc],
  exports: [AuthService, JwtModule, AuthTrpc],
})
export class AuthModule {}
