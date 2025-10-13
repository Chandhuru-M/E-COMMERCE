import http from 'http';

import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const server = http.createServer(app);

const PORT = Number(env.PORT);

server.listen(PORT, () => {
  console.log(`🚀 API ready on http://localhost:${PORT}`);
});
