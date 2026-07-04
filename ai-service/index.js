require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Gemini (Will be checked at runtime to prevent startup crash)
let genAI = null;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
        console.warn("WARNING: GEMINI_API_KEY is missing! AI Service will not be able to reply.");
    }
} catch (e) {
    console.error("Failed to initialize Gemini:", e.message);
}
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'chat_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.post('/api/ai/chat', async (req, res) => {
    try {
        let { user_id, message, session_id } = req.body;

        if (!user_id || !message) {
            return res.status(400).json({ error: 'user_id and message are required' });
        }
        
        if (!session_id) {
            session_id = uuidv4();
        }

        // Fetch username from DB so AI knows who it is talking to
        let username = "Pengguna";
        try {
            const [userRows] = await pool.execute('SELECT username FROM users WHERE id = ?', [user_id]);
            if (userRows.length > 0) {
                username = userRows[0].username;
            }
        } catch (e) {
            console.error("Error fetching username:", e.message);
        }

        // Call Gemini API
        let responseText = "";
        if (genAI) {
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash-lite",
                systemInstruction: `Anda adalah asisten AI pintar yang dibuat oleh Rifki Saputra. Saat ini Anda sedang mengobrol dengan pengguna bernama ${username}. Jawablah dengan menggunakan bahasa Indonesia yang baik, asyik, dan natural.`
            });
            
            // Get previous conversation history for this session
            let historyContext = [];
            try {
                const [histRows] = await pool.execute(
                    'SELECT request_text, response_text FROM chat_history WHERE session_id = ? ORDER BY request_time ASC',
                    [session_id]
                );
                for (const row of histRows) {
                    historyContext.push({ role: "user", parts: [{ text: row.request_text }] });
                    historyContext.push({ role: "model", parts: [{ text: row.response_text }] });
                }
            } catch (e) {
                console.error("Error fetching session history:", e.message);
            }

            const chat = model.startChat({
                history: historyContext
            });

            const result = await chat.sendMessage(message);
            responseText = result.response.text();
        } else {
            responseText = "[Error: GEMINI_API_KEY is not set in Environment Variables. AI cannot respond.]";
        }

        // Save to Database
        const [rows] = await pool.execute(
            'INSERT INTO chat_history (user_id, request_text, response_text, session_id) VALUES (?, ?, ?, ?)',
            [user_id, message, responseText, session_id]
        );

        res.json({
            reply: responseText,
            session_id: session_id,
            history_id: rows.insertId
        });
    } catch (error) {
        console.error("AI Service Error:", error);
        res.status(500).json({ error: 'Internal Server Error in AI Service' });
    }
});

app.get('/api/ai/history/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Group by session_id, get the first message of each session to display in sidebar
        const [rows] = await pool.execute(
            `SELECT session_id, MIN(request_time) as request_time, ANY_VALUE(request_text) as request_text 
             FROM chat_history 
             WHERE user_id = ? AND session_id IS NOT NULL 
             GROUP BY session_id 
             ORDER BY MIN(request_time) DESC`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/ai/history/:userId/session/:sessionId', async (req, res) => {
    try {
        const { userId, sessionId } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY request_time ASC',
            [userId, sessionId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: 'Failed to fetch session history' });
    }
});

const PORT = process.env.AI_SERVICE_PORT || 7001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Service running on port ${PORT}`);
});
