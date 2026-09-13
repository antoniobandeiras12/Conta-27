const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function requestHandler(req, res) {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');

  const searchBases = [
    process.cwd(),
    __dirname,
    path.join(__dirname, '..')
  ];

  let candidatePaths = [];

  for (const base of searchBases) {
    if (!path.extname(safePath)) {
      candidatePaths.push(path.join(base, safePath + '.html'));
      candidatePaths.push(path.join(base, safePath, 'index.html'));
    }
    candidatePaths.push(path.join(base, safePath));
  }

  let filePath = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        filePath = p;
        break;
      }
    } catch (e) {}
  }

  // Fallback caso não ache o arquivo específico
  if (!filePath) {
    for (const base of searchBases) {
      const idx = path.join(base, 'index.html');
      try {
        if (fs.existsSync(idx) && fs.statSync(idx).isFile()) {
          filePath = idx;
          break;
        }
      } catch (e) {}
    }
  }

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - Arquivo não encontrado</h1><p><a href="/">Voltar ao início</a></p>');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600'
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

const server = http.createServer(requestHandler);

if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`Servidor ativo na porta ${port}`);
  });
}

module.exports = server;
