import { createServer } from 'node:http';

// Runtime plumbing only (F0-03). This is a liveness entrypoint so the web
// container can boot inside the local Docker stack. It renders no UI screens
// and holds no workflow authority; it only proves the container runs and can
// see the API base URL it will later call through the typed contracts client.
const port = Number(process.env.PORT ?? 4000);
const apiUrl = process.env.API_URL ?? 'http://api:3000';

const server = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'web', apiUrl }));
});

server.listen(port, () => {
  console.log(`web scaffold listening on ${port} (api: ${apiUrl})`);
});
