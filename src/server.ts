import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './database/index.ts';

const port = env.PORT || 3999;

app.listen(port, async () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);

  await connectDB();
});
