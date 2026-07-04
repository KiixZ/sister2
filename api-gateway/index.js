require('dotenv').config();
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(cors());

// Logging
app.use(morgan('combined'));

// Serve static frontend files
const path = require('path');
const clientPath = path.join(__dirname, '../client');
console.log('Serving static files from:', clientPath);
app.use(express.static(clientPath));

app.get('/', (req, res) => {
    const fs = require('fs');
    let files = [];
    try {
        files = fs.readdirSync(clientPath);
    } catch (e) {
        files = [e.message];
    }
    res.send(`<h1>API Gateway is running!</h1><p>Static files failed. Checked path: ${clientPath}</p><p>Files in path: ${files.join(', ')}</p>`);
});

// Database connection for login
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'chat_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Gateway - Distributed AI Chat',
            version: '1.0.0',
            description: 'API documentation for the AI Chat System',
        },
        servers: [
            {
                url: 'http://localhost:7000',
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-KEY'
                }
            }
        },
        security: [{
            ApiKeyAuth: []
        }]
    },
    apis: ['./index.js'], // files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Simple Authentication Middleware (API Key)
const API_KEY = process.env.GATEWAY_API_KEY || 'my-secret-api-key';

const authenticate = (req, res, next) => {
    // login path is exempt from API key for simplicity, or we can require it
    if (req.path === '/api/login') return next();

    const apiKey = req.header('X-API-KEY');
    if (apiKey === API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
};

app.use(authenticate);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User Login
 *     description: Simple login endpoint that checks username and password against the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            res.json({ message: 'Login successful', user_id: rows[0].id, api_key: API_KEY });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with AI
 *     description: Forwards chat request to AI Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response from AI
 *       500:
 *         description: Internal server error
 */
app.post('/api/chat', async (req, res) => {
    try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:7001';
        const response = await axios.post(`${aiServiceUrl}/api/ai/chat`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("Error communicating with AI Service:", error.message);
        res.status(500).json({ error: 'Failed to communicate with AI Service' });
    }
});

/**
 * @swagger
 * /api/history/{userId}:
 *   get:
 *     summary: Get chat history
 *     description: Fetches chat history for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of chat history records
 */
app.get('/api/history/:userId', async (req, res) => {
    try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:7001';
        const response = await axios.get(`${aiServiceUrl}/api/ai/history/${req.params.userId}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching history:", error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});


const PORT = process.env.API_GATEWAY_PORT || 7000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway running on port ${PORT}`);
});
