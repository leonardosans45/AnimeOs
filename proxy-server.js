// Simple Node.js proxy for HLS/MP4 with Referer/Origin injection
// Solo para Consumet/animekai. No legacy aniwatch.
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 5050;

const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = urlObj.searchParams.get('url');
    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Missing url param');
    }
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    // Usa el Referer dinámico que viene del frontend/backend
    const refererHeader = urlObj.searchParams.get('referer') || `https://${parsed.host}`;
    const originHeader = urlObj.searchParams.get('origin') || `https://${parsed.host}`;
    const options = {
        method: 'GET',
        headers: {
            ...req.headers,
            'referer': refererHeader,
            'origin': originHeader,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'host': parsed.host
        }
    };
    delete options.headers['host'];
    delete options.headers['connection'];
    delete options.headers['accept-encoding'];
    console.log(`[PROXY] Proxying request: ${targetUrl} (Host: ${parsed.host})`);
    console.log(`[PROXY] Using Referer: ${refererHeader}`);
    console.log(`[PROXY] Using Origin: ${originHeader}`);
    const proxyReq = client.request(targetUrl, options, proxyRes => {
        console.log(`[PROXY] Response from ${targetUrl}: ${proxyRes.statusCode}`);
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err.message);
    });
    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
