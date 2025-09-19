import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { createServer } from 'http';
import { prisma } from './lib/prisma';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { webSocketService } from './modules/sockets';
import { bullQueueService } from './modules/queue';
import { morganStream } from './utils/winston-logger';
import logger from './utils/winston-logger';

// Load environment variables
config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-google-oauth-code'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logging with Morgan
app.use(morgan('combined', { stream: morganStream }));

// Cookie parser middleware
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main API endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Hello API', version: '1.0.0' });
});

// Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await bullQueueService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await bullQueueService.close();
  await prisma.$disconnect();
  process.exit(0);
});

server.listen(port, host, () => {
  logger.info(`Server ready at http://${host}:${port}`);
  logger.websocket('WebSocket server initialized');
});
