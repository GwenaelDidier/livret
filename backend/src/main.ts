import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function bootstrap() {
  // Ensure data directory exists for SQLite
  await mkdir(join(process.cwd(), 'data'), { recursive: true });

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
  console.log(`API running on http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
