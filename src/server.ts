import { app } from './app.ts';
import { env } from './config/env.ts';

import { generateSwagger } from './config/swagger.ts';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger-output.json' with { type: 'json' };
import { connectRedis } from './config/redis.ts';
import { startCronJobs } from './services/cronService.ts';

const port = env.PORT || 3999;

async function start() {
  await generateSwagger();

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(port, () => {
    connectRedis();
    // startCronJobs();
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/docs`);
  });
}

start();
