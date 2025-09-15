import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '../interfaces/auth.interface';

@Injectable()
export class JwtTokenAdapter implements ITokenService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  sign(payload: any, options?: any): string {
    return this.jwtService.sign(payload, options);
  }

  verify(token: string): any {
    return this.jwtService.verify(token);
  }

  decode(token: string): any {
    return this.jwtService.decode(token);
  }
}
