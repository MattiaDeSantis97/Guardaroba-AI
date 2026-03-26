export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Estrazione e pulizia forzata della chiave (rimuove spazi e virgolette)
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/['"]/g, '');
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key mancante sul server Vercel' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        // Inoltra l'errore nativo di Google al frontend per un debug accurato
        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Errore Google API' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
