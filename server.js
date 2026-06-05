import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend static files

// Web Search Helper (Scrapes DuckDuckGo HTML search results)
async function searchDuckDuckGo(query) {
    console.log(`[Buscador] Realizando búsqueda web para: "${query}"`);
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`DDG response error: ${response.status}`);
        }

        const html = await response.text();
        
        // Regex to extract titles and snippets
        const titleRegex = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>/g;
        const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

        const titles = [];
        const snippets = [];
        let match;

        while ((match = titleRegex.exec(html)) !== null) {
            titles.push(match[1].replace(/<[^>]*>/g, '').trim());
        }

        while ((match = snippetRegex.exec(html)) !== null) {
            snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
        }

        // Combine top 3 results
        const results = [];
        const maxResults = Math.min(titles.length, snippets.length, 3);
        
        for (let i = 0; i < maxResults; i++) {
            results.push(`Resultado ${i + 1}: "${titles[i]}" - Descripción: ${snippets[i]}`);
        }

        if (results.length === 0) {
            return "No se encontraron resultados de búsqueda relevantes.";
        }

        console.log(`[Buscador] Búsqueda completada con éxito. Se obtuvieron ${results.length} resultados.`);
        return results.join('\n\n');
    } catch (error) {
        console.error('[Buscador] Error al realizar la búsqueda web:', error.message);
        return `Error en la búsqueda web: ${error.message}`;
    }
}

// Function to decide if search is needed and extract query
function detectSearchRequirement(message) {
    const text = message.toLowerCase().trim();

    // Trigger words for real-time searches
    const searchKeywords = [
        'busca', 'buscar', 'internet', 'clima', 'tiempo hoy', 'noticias', 
        'presidente', 'quién es', 'quien es', 'dónde está', 'dónde queda', 
        'precio del', 'dolar', 'dólar', 'actual', 'último', 'ultimo', 'noticia'
    ];

    // Explicit command: "busca [query]"
    const explicitMatch = text.match(/^(?:busca|buscar|busca en internet sobre|busca sobre)\s+(.+)$/i);
    if (explicitMatch && explicitMatch[1]) {
        return { required: true, query: explicitMatch[1].trim() };
    }

    // Keyword detection
    const needsSearch = searchKeywords.some(keyword => text.includes(keyword));
    if (needsSearch) {
        // Use the whole message as the query
        return { required: true, query: message };
    }

    return { required: false, query: null };
}

// Endpoint: Chat with Ollama (Llama)
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log(`[Chat] Mensaje recibido del usuario: "${message}"`);

    try {
        let searchContext = '';
        const searchCheck = detectSearchRequirement(message);

        if (searchCheck.required) {
            searchContext = await searchDuckDuckGo(searchCheck.query);
        }

        // Construct messages array for Ollama
        const systemPrompt = `Eres Sophia, una asistente de inteligencia artificial avanzada con estética cyberpunk y hologramas HUD.
Respondes en español de forma inteligente, concisa, elegante y profesional. Eres atenta y te diriges al usuario con respeto ("señor").
Mantén las respuestas a un tamaño razonable para que sean cómodas al ser leídas por voz (evita bloques gigantes de texto a menos que te pidan explicaciones detalladas).

${searchContext ? `CONTEXTO DE BÚSQUEDA EN INTERNET EN TIEMPO REAL (Úsalo para responder la consulta con datos frescos y actualizados):
${searchContext}
Por favor, integra esta información en tu respuesta de manera natural, citando los hechos pertinentes.` : ''}`;

        // Format history for Ollama chat API
        const messagesForOllama = [
            { role: 'system', content: systemPrompt }
        ];

        // Add history (keep last 6 messages for context limits & speed)
        const recentHistory = history ? history.slice(-6) : [];
        recentHistory.forEach(msg => {
            messagesForOllama.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        });

        // Add current user message
        messagesForOllama.push({ role: 'user', content: message });

        console.log('[Ollama] Enviando petición a Ollama local...');
        const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2', // matches the user's downloaded model
                messages: messagesForOllama,
                stream: false
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama response error: ${ollamaResponse.statusText}`);
        }

        const data = await ollamaResponse.json();
        const reply = data.message.content;

        console.log(`[Ollama] Respuesta generada: "${reply.substring(0, 50)}..."`);
        
        res.json({
            reply: reply,
            searchPerformed: searchCheck.required,
            searchQuery: searchCheck.query
        });

    } catch (error) {
        console.error('[API Error]', error);
        res.status(500).json({
            error: 'No se pudo conectar con Ollama. Asegúrate de tener Ollama activo y el modelo llama3.2 descargado.',
            details: error.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`SERVIDOR SOPHIA ACTIVO: http://localhost:${PORT}`);
    console.log(`Asegúrate de que Ollama esté corriendo en segundo plano`);
    console.log(`y de haber descargado Llama 3.2 con: ollama run llama3.2`);
    console.log(`==================================================`);
});
