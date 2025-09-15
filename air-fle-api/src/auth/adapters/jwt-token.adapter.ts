import { Injectable, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ITokenService } from '../interfaces/auth.interface';

@Injectable()
export class JwtTokenAdapter implements ITokenService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  sign(payload: string | Buffer | object, options?: JwtSignOptions): string {
    if (typeof payload === 'string') {
      return this.jwtService.sign(payload, options);
    }
    return this.jwtService.sign(payload as object | Buffer, options);
  }

  verify<T extends object = Record<string, unknown>>(token: string): T {
    return this.jwtService.verify<T>(token);
  }

  decode<T = Record<string, unknown>>(token: string): T | null {
    return this.jwtService.decode<T>(token);
  }
}
