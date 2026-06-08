import './config/bigint.ts';
import { app } from './app.js';
import { env } from './config/env.js';

const port = env.PORT || 3999;

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
