require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3002; // Local backend will run on port 3002

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set in backend/.env');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initial chat history for Gemini to act as a CLI
const initialChatHistory = [
    { role: "user", parts: [{ text: "You are a command-line interface (CLI) assistant. Respond concisely, as if you are a terminal. Do not include conversational filler. Only provide the output of the command or a brief, direct response. If a command is not recognized, state 'Command not found: [command]'." }] },
    { role: "model", parts: [{ text: "CLI Ready." }] }
];

// Store chat history per session (in a real app, this would be more robust)
const sessions = {};

app.post('/execute-command', async (req, res) => {
    const { command, sessionId } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // Initialize session chat history if not exists
    if (!sessions[sessionId]) {
        sessions[sessionId] = [...initialChatHistory];
    }

    const currentChatHistory = [...sessions[sessionId], { role: "user", parts: [{ text: command }] }];

    try {
        const result = await model.generateContent({ contents: currentChatHistory });
        const geminiResponseText = result.response.text();

        // Update session history with Gemini's response
        sessions[sessionId].push({ role: "user", parts: [{ text: command }] });
        sessions[sessionId].push({ role: "model", parts: [{ text: geminiResponseText }] });

        // Check if Gemini's response indicates a shell command to execute
        // This is a simple heuristic; a more robust solution might involve tool use or structured output
        if (geminiResponseText.startsWith('EXECUTE_SHELL:')) {
            const shellCommand = geminiResponseText.substring('EXECUTE_SHELL:'.length).trim();
            const execCwd = "/Users/home/Gemini-cli-web.bak";
            console.log(`Attempting to execute: '${shellCommand}' with CWD: '${execCwd}'`);
            exec(shellCommand, { cwd: execCwd }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error.message}`);
                    console.error(`exec stderr: ${stderr}`);
                    return res.json({ output: stderr || error.message, type: 'error' });
                }
                if (stderr) {
                    console.warn(`exec stderr: ${stderr}`);
                    return res.json({ output: stderr, type: 'error' });
                }
                console.log(`exec stdout: ${stdout}`);
                res.json({ output: stdout, type: 'success' });
            });
        } else {
            // If Gemini doesn't indicate a shell command, just return its text response
            res.json({ output: geminiResponseText, type: 'gemini' });
        }

    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: `Gemini API error: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
