import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SelfProfileGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    // Vérifier si l'utilisateur accède à son propre profil
    if (user && params.id && user.user_uuid === params.id) {
      // Vérifier si l'utilisateur est un enseignant avec la permission self:read
      if (
        user.role?.role_name === 'teacher' &&
        user.permissions &&
        user.permissions.includes('self:read')
      ) {
        return true;
      }

      // Ou si c'est un autre rôle (permettre l'accès à son propre profil par défaut)
      if (user.role?.role_name !== 'teacher') {
        return true;
      }
    }

    // Permettre l'accès aux administrateurs à tous les profils
    if (user && user.role?.role_name === 'admin') {
      return true;
    }

    throw new ForbiddenException(
      "Vous ne pouvez accéder qu'à votre propre profil",
    );
  }
}
