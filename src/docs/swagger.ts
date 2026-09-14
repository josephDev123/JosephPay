import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_UI_PATH = 'docs';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Fintech Platform API')
    .setDescription('Swagger documentation for the fintech backend API')
    .setVersion('1.0.0')
    .addCookieAuth('access_token', undefined, 'cookieAuth')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  return document;
}
