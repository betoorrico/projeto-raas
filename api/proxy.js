// CommonJS Proxy Function
// Forces Vercel to treat this as a standard Node.js lambda
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        console.log("Proxying to N8N (CommonJS)...", payload);

        // Fetch is global in Node 18+ on Vercel
        const n8nResponse = await fetch('https://webhook.manarafluxo.online/webhook/coloca-processo-rag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await n8nResponse.text();

        try {
            const json = JSON.parse(data);
            return res.status(n8nResponse.status).json(json);
        } catch (e) {
            return res.status(n8nResponse.status).send(data);
        }

    } catch (error) {
        console.error("Proxy Logic Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
