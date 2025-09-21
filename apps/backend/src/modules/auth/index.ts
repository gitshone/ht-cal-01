import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { createAuthRoutes } from './auth.routes';
import { TokenBlacklistRepository } from './token-blacklist.repository';
import { EventsRepository } from '../events/events.repository';

export const createAuthModule = () => {
  const authRepository = new AuthRepository();
  const tokenBlacklistRepository = new TokenBlacklistRepository();
  const eventsRepository = new EventsRepository();
  const authService = new AuthService(
    authRepository,
    tokenBlacklistRepository,
    eventsRepository
  );
  const authController = new AuthController(authService);
  const authRoutes = createAuthRoutes(authController);

  return {
    repository: authRepository,
    tokenBlacklistRepository,
    service: authService,
    controller: authController,
    routes: authRoutes,
  };
};
