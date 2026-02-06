// api/proxy.js
export default async function handler(req, res) {
  // 1. Gestione permessi (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Risponde subito alle richieste di controllo del browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Recupera la chiave sicura dalle impostazioni di Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chiave API non configurata nel server' });
  }

  try {
    // 3. Legge il prompt inviato dal tuo sito
    const { prompt } = req.body; // Vercel analizza automaticamente il body JSON

    // 4. Chiama Google Gemini (lato server)
    const modelName = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await googleResponse.json();

    // 5. Manda la risposta al tuo sito
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante la comunicazione con AI' });
  }
}
