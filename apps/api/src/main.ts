import './instrument.ts';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './core/config/app-config.service';
import { ClassValidatorFormatterPipe } from './shared/pipes/class-validator-formatter.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Global validation pipe
  app.useGlobalPipes(new ClassValidatorFormatterPipe());

  // CORS configuration
  app.enableCors({
    origin: config.isDevelopment ? true : process.env.FRONTEND_URL,
    credentials: true,
  });

  // Swagger documentation
  if (config.isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HT Calendar API')
      .setDescription('The HT Calendar API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document);
  }

  const port = config.port;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  if (config.isDevelopment) {
    Logger.log(
      `📚 Swagger documentation: http://localhost:${port}/${globalPrefix}/docs`
    );
  }
}

bootstrap();
