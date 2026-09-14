import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from '../src/docs/swagger.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/docs-json (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);

    expect(response.body.openapi).toBeDefined();
    expect(response.body.paths['/']).toBeDefined();
    expect(response.body.paths['/api/v1/auth/login']).toBeDefined();
    expect(response.body.paths['/api/v1/users']).toBeDefined();
    expect(response.body.paths['/api/v1/users/{id}']).toBeDefined();
    expect(response.body.paths['/api/v1/wallet']).toBeDefined();
    expect(response.body.paths['/api/v1/kyc/{userId}']).toBeDefined();
    expect(response.body.paths['/api/v1/kyc/{userId}/review']).toBeDefined();
  });

  it('/docs (GET)', () => {
    return request(app.getHttpServer()).get('/docs').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
