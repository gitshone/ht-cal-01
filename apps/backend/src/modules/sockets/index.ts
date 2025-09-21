import { SocketsService } from './sockets.service';

export const createSocketsModule = () => {
  const socketsService = new SocketsService();

  return {
    service: socketsService,
  };
};

// Legacy exports for backward compatibility
export { SocketsService } from './sockets.service';
