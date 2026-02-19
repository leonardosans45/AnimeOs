const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5051;

app.use(cors());

// Función para envolver la URL en nuestro proxy
const wrapUrl = (targetUrl, referer) => {
    return `http://localhost:${PORT}/proxy?referer=${encodeURIComponent(referer)}&url=${encodeURIComponent(targetUrl)}`;
};

app.get('/proxy', async (req, res) => { 
    const { url, referer } = req.query;

    if (!url) return res.status(400).send('Falta URL');

    const refererReal = referer || 'https://4spromax.site/';
    const isM3u8 = url.includes('.m3u8');
    const isTs = url.includes('.ts');

    console.log(`\n🔵 [PETICIÓN] Tipo: ${isM3u8 ? 'LISTA' : (isTs ? 'VIDEO' : 'OTRO')} | URL: ${url.substring(0, 50)}...`);

    try {
        const response = await axios({
            method: 'get',
            url: decodeURIComponent(url),
            responseType: isM3u8 ? 'text' : 'stream',
            headers: {
                'Referer': refererReal,
                'Origin': 'https://4spromax.site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        // Aseguramos CORS
        res.set('Access-Control-Allow-Origin', '*');

        if (isM3u8) {
            const m3u8Content = response.data;
            
            // --- DIAGNÓSTICO: ¿Qué estamos descargando realmente? ---
            console.log("   👀 PRIMERAS LÍNEAS ORIGINALES:");
            console.log(m3u8Content.split('\n').slice(0, 2).join('\n'));

            // Usamos la URL original como base para resolver rutas relativas (../ o ./)
            const baseUrl = decodeURIComponent(url);

            const lines = m3u8Content.split('\n');
            const newLines = lines.map(line => {
                const trimmed = line.trim();
                
                // Si es comentario o vacío, ignorar
                if (trimmed === '') return line;

                // CASO 1: Es una URL de video (o sub-lista)
                if (!trimmed.startsWith('#')) {
                    try {
                        // new URL() hace la magia de resolver rutas relativas automáticamente
                        const absoluteUrl = new URL(trimmed, baseUrl).href;
                        return wrapUrl(absoluteUrl, refererReal);
                    } catch (e) {
                        return line; // Si falla, devolvemos la línea original
                    }
                }

                // CASO 2: Encriptación (#EXT-X-KEY: ... URI="...")
                if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
                    return line.replace(/URI="([^"]+)"/, (match, uriValue) => {
                        try {
                            const absoluteUrl = new URL(uriValue, baseUrl).href;
                            return `URI="${wrapUrl(absoluteUrl, refererReal)}"`;
                        } catch (e) {
                            return match;
                        }
                    });
                }

                return line;
            });

            console.log("   ✨ PRIMERAS LÍNEAS REESCRITAS:");
            console.log(newLines.slice(0, 10).join('\n'));

            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            res.send(newLines.join('\n'));

        } else {
            // Es video o key
            if (isTs) res.set('Content-Type', 'video/mp2t');
            response.data.pipe(res);
        }

    } catch (error) {
        console.error("🔥 ERROR PROXY:", error.message);
        if (error.response) console.error("   Status del servidor remoto:", error.response.status);
        if (!res.headersSent) res.status(500).send('Error proxy');
    }
});

app.listen(PORT, () => {
    console.log(`👨‍⚕️ Proxy V4 (Diagnóstico) corriendo en: http://localhost:${PORT}`);
});