# Simple Dockerfile that uses pre-built application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files for production dependencies only
COPY package.json ./
COPY apps/backend/package.json ./backend-package.json

# Install only the required production dependencies
RUN npm install --only=production express dotenv @prisma/client firebase-admin jsonwebtoken cors bcryptjs

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./prisma/
RUN npx prisma generate

# Copy the pre-built application
COPY apps/backend/dist ./dist

# Copy shared types (if needed)
COPY libs/shared-types/dist ./node_modules/@ht-cal-01/shared-types/dist

# Copy entrypoint script
COPY apps/backend/docker/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Expose the port
EXPOSE 3000

# Start the application
CMD ["./docker-entrypoint.sh"]
