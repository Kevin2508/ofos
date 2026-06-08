import { app } from './app.ts';
import { env } from './config/env.ts';

const port = env.PORT || 3999;

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
