import { app } from './app.ts';
import { env } from './config/env.ts';
import { connectRedis } from './config/redis.ts';

const port = env.PORT || 3999;

app.listen(port, () => {
  connectRedis();
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
