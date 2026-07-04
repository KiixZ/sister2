require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create MySQL connection pool
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
        const { user_id, message } = req.body;
        
        if (!user_id || !message) {
            return res.status(400).json({ error: 'user_id and message are required' });
        }

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const responseText = result.response.text();
        
        // Save to Database
        const [rows] = await pool.execute(
            'INSERT INTO chat_history (user_id, request_text, response_text) VALUES (?, ?, ?)',
            [user_id, message, responseText]
        );

        res.json({
            reply: responseText,
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
        const [rows] = await pool.execute(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY request_time DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

const PORT = process.env.AI_SERVICE_PORT || 7001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Service running on port ${PORT}`);
});
