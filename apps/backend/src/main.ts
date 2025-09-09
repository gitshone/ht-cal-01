import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { prisma } from './lib/prisma';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';

// Load environment variables
config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  })
);
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
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
