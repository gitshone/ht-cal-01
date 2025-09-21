import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { createSettingsRoutes } from './settings.routes';

export const createSettingsModule = () => {
  const settingsRepository = new SettingsRepository();
  const settingsService = new SettingsService(settingsRepository);
  const settingsController = new SettingsController(settingsService);
  const settingsRoutes = createSettingsRoutes(settingsController);

  return {
    repository: settingsRepository,
    service: settingsService,
    controller: settingsController,
    routes: settingsRoutes,
  };
};
