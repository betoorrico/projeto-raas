export default async function handler(req, res) {
    // Enable CORS for the Vercel function (though being same-origin mostly applies here, good practice)
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;

        console.log("Proxying payload to N8N:", payload);

        // Convert JSON payload to URLSearchParams for N8N Form compliance
        const formData = new URLSearchParams();
        formData.append("file_name", payload.file_name);
        formData.append("processo", payload.processo);

        // Forward to N8N Webhook as Form
        const n8nResponse = await fetch('https://webhook.manarafluxo.online/form/7a1d3b19-d14a-421c-8c46-2315c8415017', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await n8nResponse.text();

        console.log("N8N Response:", data);

        // Try to parse JSON if possible, else return text
        try {
            const jsonData = JSON.parse(data);
            return res.status(n8nResponse.status).json(jsonData);
        } catch (e) {
            return res.status(n8nResponse.status).send(data);
        }

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
