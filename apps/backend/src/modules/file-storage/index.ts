import { FileStorageService } from './file-storage.service';
import { FileStorageController } from './file-storage.controller';
import { createFileStorageRoutes } from './file-storage.routes';

export const createFileStorageModule = () => {
  const fileStorageService = new FileStorageService();
  const fileStorageController = new FileStorageController(fileStorageService);
  const fileStorageRoutes = createFileStorageRoutes(fileStorageController);

  return {
    service: fileStorageService,
    controller: fileStorageController,
    routes: fileStorageRoutes,
  };
};

export { FileStorageService } from './file-storage.service';
export { FileStorageController } from './file-storage.controller';
export { createFileStorageRoutes } from './file-storage.routes';
