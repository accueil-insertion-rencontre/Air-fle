import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserService } from '../../user/user.service';
import { ISecurityService } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject('ISecurityService') private securityService: ISecurityService,
    private userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required but not found in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    // Vérifier si le token est dans la liste noire (révoqué)
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.securityService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException('Token invalide ou révoqué');
    }

    // Vérifier si l'utilisateur existe toujours dans la base de données
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé ou supprimé');
    }

    // Vérifier si le token a été émis avant un changement de mot de passe
    if (
      await this.securityService.isTokenIssuedBeforePasswordChange(
        payload.sub,
        payload.iat,
      )
    ) {
      throw new UnauthorizedException(
        'Session expirée suite à un changement de mot de passe',
      );
    }

    // Retourner les données à jour de l'utilisateur depuis la base de données
    // au lieu des données potentiellement obsolètes du token
    return {
      user_uuid: user.user_uuid,
      user_mail: user.user_mail,
      user_firstname: user.user_firstname,
      user_lastname: user.user_lastname,
      role: user.role,
    };
  }
}
