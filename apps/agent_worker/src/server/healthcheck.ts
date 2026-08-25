import http from 'http';

export function createHealthcheckServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port);
  console.log(`[Healthcheck] Listening on port ${port}`);
  return server;
}
