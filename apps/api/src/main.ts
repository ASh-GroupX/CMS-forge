import { createServer } from 'node:http';

// Runtime plumbing only (F0-03). This is a liveness entrypoint so the API
// container can boot inside the local Docker stack. It owns no domain behavior:
// no modules, auth, workflow, or database access live here yet.
const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL ?? '';
const redisUrl = process.env.REDIS_URL ?? '';

const server = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'api',
      databaseConfigured: databaseUrl.length > 0,
      redisConfigured: redisUrl.length > 0,
    }),
  );
});

server.listen(port, () => {
  console.log(`api scaffold listening on ${port}`);
});
