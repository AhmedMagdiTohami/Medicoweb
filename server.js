const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Intercept Netlify serverless functions locally for testing
    if (req.url.startsWith('/.netlify/functions/')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const urlParts = req.url.split('/');
                const functionName = urlParts[urlParts.length - 1].split('?')[0];
                const functionPath = path.join(__dirname, 'netlify', 'functions', `${functionName}.js`);
                
                if (fs.existsSync(functionPath)) {
                    // Clear require cache to enable hot-reloads during development
                    delete require.cache[require.resolve(functionPath)];
                    const { handler } = require(functionPath);
                    
                    const event = {
                        httpMethod: req.method,
                        headers: req.headers,
                        body: body
                    };
                    
                    const result = await handler(event, {});
                    
                    res.writeHead(result.statusCode, result.headers || {});
                    res.end(result.body || '');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Serverless Function Not Found');
                }
            } catch (err) {
                console.error('Error executing local serverless function:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Internal Server Error: ${err.message}`);
            }
        });
        return;
    }

    // Prevent directory traversal
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') {
        safeUrl = '/index.html';
    }
    
    const filePath = path.join(__dirname, safeUrl);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
