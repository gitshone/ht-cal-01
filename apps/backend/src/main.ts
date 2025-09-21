import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { createServer } from 'http';
import { prisma } from './core/lib/prisma';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { registerAllProviders, getService, providers } from './core';
import { morganStream } from './utils/winston-logger';
import logger from './utils/winston-logger';

config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

const server = createServer(app);

registerAllProviders();

const socketsService = getService(providers.SOCKETS_SERVICE) as {
  initialize: (server: unknown) => void;
};
socketsService.initialize(server);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-google-oauth-code'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('combined', { stream: morganStream }));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send({ message: 'Hello API', version: '1.0.0' });
});

app.use('/', routes);

app.use(errorHandler);

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  const bullQueueService = getService(providers.BULL_QUEUE_SERVICE) as {
    close: () => Promise<void>;
  };
  await bullQueueService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  const bullQueueService = getService(providers.BULL_QUEUE_SERVICE) as {
    close: () => Promise<void>;
  };
  await bullQueueService.close();
  await prisma.$disconnect();
  process.exit(0);
});

server.listen(port, host, () => {
  logger.info(`Server ready at http://${host}:${port}`);
  logger.websocket('WebSocket server initialized');
});
