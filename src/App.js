import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Paper,
    CssBaseline,
    ThemeProvider,
    createTheme
} from '@mui/material';
import { Terminal as TerminalIcon } from 'lucide-react'; // For the header icon

// Define a dark theme for MUI
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#63b3ed', // A slightly brighter blue for primary actions and accents
        },
        secondary: {
            main: '#f48fb1', // Pink for secondary
        },
        background: {
            default: '#1a202c', // Dark gray for body background
            paper: '#2d3748', // Slightly lighter dark gray for components
        },
        text: {
            primary: '#e2e8f0', // Light gray for general text
            secondary: '#a0aec0', // Muted gray for secondary text
        },
        success: {
            main: '#48bb78', // Green for user input
        },
        error: {
            main: '#f56565', // Red for errors
        },
        info: {
            main: '#63b3ed', // Blue for loading/info
        },
    },
    typography: {
        fontFamily: 'Inter, monospace', // Use Inter and monospace for terminal feel
        body2: {
            lineHeight: 1.6, // Enhanced line spacing for readability
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px', // Slightly more rounded corners
                    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.4)', // Deeper shadow for depth
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px', // Rounded corners for buttons
                    transition: 'all 0.3s ease-in-out', // Smooth transitions for hover effects
                    '&:hover': {
                        transform: 'translateY(-2px)', // Slight lift on hover
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px', // Rounded corners for text field input
                        transition: 'box-shadow 0.3s ease-in-out', // Smooth transition for focus ring
                    },
                },
            },
        },
    },
});

// Main App component
const App = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: "user", parts: [{ text: "You are a command-line interface (CLI) assistant. Respond concisely, as if you are a terminal. Do not include conversational filler. Only provide the output of the command or a brief, direct response. If a command is not recognized, state 'Command not found: [command]'." }] },
        { role: "model", parts: [{ text: "CLI Ready. Current environment: Dockerized." }] }
    ]); // To retain context for Gemini
    const [typingResponse, setTypingResponse] = useState(''); // For typing animation
    const [isTyping, setIsTyping] = useState(false); // To control typing animation
    const outputRef = useRef(null);
    const sessionId = useRef(crypto.randomUUID()); // Generate a unique session ID

    // New authentication states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true); // true for login, false for signup
    const [authError, setAuthError] = useState(null);

    // Environment selection state
    const [environment, setEnvironment] = useState('docker'); // 'docker' or 'local'

    // Firebase state variables
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [firebaseInitialized, setFirebaseInitialized] = useState(false); // New state to track Firebase init

    // Initialize Firebase and authenticate
    useEffect(() => {
        let firebaseConfig = {};

        try {
            // Check if running in Canvas environment (where __firebase_config is defined)
            // eslint-disable-next-line no-undef
            if (typeof __firebase_config !== 'undefined') {
                // eslint-disable-next-line no-undef
                firebaseConfig = JSON.parse(__firebase_config);
            } else if (process.env.REACT_APP_FIREBASE_PROJECT_ID) {
                // Running in a Node.js-like environment (e.g., Docker build or local dev server)
                firebaseConfig = {
                    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.REACT_APP_FIREBASE_APP_ID,
                    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
                };
            } else {
                console.warn("Firebase configuration not found. Firebase will not be initialized.");
                setOutput(prev => [...prev, { type: 'error', text: "Firebase not initialized: Configuration missing. Running without Firebase." }]);
                setIsAuthReady(true);
                return;
            }

            // Check if projectId is provided (essential for Firebase init)
            console.log("Firebase config being used:", firebaseConfig);
            if (!firebaseConfig.projectId) {
                console.warn("Firebase 'projectId' not provided in configuration. Firebase will not be fully initialized.");
                setOutput(prev => [...prev, { type: 'error', text: "Firebase not fully initialized: Missing 'projectId'. Some features may not work." }]);
                setIsAuthReady(true);
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);
            setFirebaseInitialized(true); // Mark Firebase as initialized

            // Listen for auth state changes
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe; // Cleanup subscription

        } catch (error) {
            console.error("Firebase initialization error:", error);
            setOutput(prev => [...prev, { type: 'error', text: `Firebase init failed: ${error.message}` }]);
            setIsAuthReady(true); // Still set to true to allow app to run without Firestore
        }
    }, []);

    // Scroll to bottom when output changes or typing completes
    useEffect(() => {
        if (outputRef.current) {
            // Use smooth scroll behavior
            outputRef.current.scrollTo({
                top: outputRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [output, typingResponse]);

    // Typing animation effect for Gemini response
    useEffect(() => {
        if (isTyping && typingResponse.length < output[output.length - 1]?.fullText?.length) {
            const timer = setTimeout(() => {
                setTypingResponse(prev => output[output.length - 1].fullText.substring(0, prev.length + 1));
            }, 10); // Adjust typing speed here (milliseconds per character)
            return () => clearTimeout(timer);
        } else if (isTyping && typingResponse.length === output[output.length - 1]?.fullText?.length) {
            setIsTyping(false);
            setTypingResponse(''); // Clear typing buffer
            // Update the last Gemini message in output with its full text
            setOutput(prevOutput => {
                const newOutput = [...prevOutput];
                if (newOutput.length > 0) {
                    const lastIndex = newOutput.length - 1;
                    if (newOutput[lastIndex].type === 'gemini') {
                        newOutput[lastIndex] = { ...newOutput[lastIndex], text: newOutput[lastIndex].fullText };
                    }
                }
                return newOutput;
            });
        }
    }, [isTyping, typingResponse, output]);


    // Handle input submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const command = input.trim();
        if (!command) return;

        setOutput(prev => [...prev, { type: 'user', text: `> ${command}` }]);
        setInput('');

        setIsLoading(true);

        try {
            const backendUrl = environment === 'docker' ? 'http://localhost:3002' : 'http://localhost:3001';
            console.log(`Sending command to: ${backendUrl}/execute-command`);
            const response = await fetch(`${backendUrl}/execute-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, sessionId: sessionId.current })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            const { output: backendOutput, type: outputType } = result;

            if (backendOutput) {
                // Prepare for typing animation if it's a Gemini response
                if (outputType === 'gemini') {
                    setOutput(prev => [...prev, { type: outputType, text: '', fullText: backendOutput }]);
                    setTypingResponse('');
                    setIsTyping(true);
                } else {
                    // For shell command output or errors, display immediately
                    setOutput(prev => [...prev, { type: outputType, text: backendOutput }]);
                }

                // Update chat history with both user and Gemini's response for context
                // The backend now manages the full chat history for Gemini interaction
                // We only add the user's command to the frontend's chatHistory for display purposes
                setChatHistory(prev => [...prev, { role: "user", parts: [{ text: command }] }, { role: "model", parts: [{ text: backendOutput }] }]);

            } else {
                setOutput(prev => [...prev, { type: 'error', text: 'Backend did not return a valid response.' }]);
            }
        } catch (error) {
            console.error("Backend communication error:", error);
            setOutput(prev => [...prev, { type: 'error', text: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Authentication handlers
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setIsLoading(true);

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            setAuthError(error.message);
            console.error("Authentication error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setChatHistory([
                { role: "user", parts: [{ text: "You are a command-line interface (CLI) assistant. Respond concisely, as if you are a terminal. Do not include conversational filler. Only provide the output of the command or a brief, direct response. If a command is not recognized, state 'Command not found: [command]'." }] },
                { role: "model", parts: [{ text: "CLI Ready." }] }
            ]); // Reset chat history on logout
            setOutput([]); // Clear terminal output on logout
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline /> {/* Provides a baseline of styles */}
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'radial-gradient(circle at top left, #1a202c 0%, #0f141c 100%)', // Subtle gradient background
                    color: 'text.primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                {!isAuthReady ? (
                    <CircularProgress color="primary" />
                ) : userId ? (
                    <Paper
                        elevation={10}
                        sx={{
                            width: '100%',
                            maxWidth: '800px',
                            bgcolor: 'background.paper',
                            borderRadius: '12px', // More rounded
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            height: { xs: '70vh', md: '80vh' }, // Responsive height
                            boxShadow: '0px 15px 40px rgba(0, 0, 0, 0.6)', // Even deeper shadow
                        }}
                    >
                        {/* Terminal Header */}
                        <Box
                            sx={{
                                bgcolor: 'grey.900', // Even darker gray for header
                                px: 2,
                                py: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid',
                                borderColor: 'grey.700',
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: '50%' }} />
                                <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: '50%' }} />
                                <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: '50%' }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TerminalIcon size={16} color={darkTheme.palette.primary.main} /> Gemini CLI Web App
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Environment:
                                </Typography>
                                <Button
                                    variant={environment === 'docker' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setEnvironment('docker')}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Docker
                                </Button>
                                <Button
                                    variant={environment === 'local' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setEnvironment('local')}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Local
                                </Button>
                                {userId && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleLogout}
                                        sx={{ textTransform: 'none', ml: 2 }}
                                    >
                                        Logout
                                    </Button>
                                )}
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {userId ? `User ID: ${userId.substring(0, 8)}...` : 'Authenticating...'}
                            </Typography>
                        </Box>

                        {/* Terminal Output Area */}
                        <Box
                            ref={outputRef}
                            sx={{
                                flexGrow: 1,
                                p: 2,
                                overflowY: 'auto',
                                fontSize: '0.875rem', // text-sm
                                scrollBehavior: 'smooth', // Smooth scrolling
                                // Custom scrollbar styles
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: darkTheme.palette.background.paper,
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: darkTheme.palette.grey[700],
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    background: darkTheme.palette.grey[500],
                                },
                            }}
                        >
                            {output.map((line, index) => (
                                <Typography
                                    key={index}
                                    variant="body2"
                                    sx={{
                                        color: line.type === 'user' ? 'success.main' : line.type === 'error' ? 'error.main' : line.type === 'info' ? 'info.main' : 'text.primary',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        mb: 0.5,
                                        // Apply typing effect only to the last Gemini response
                                        ...(line.type === 'gemini' && index === output.length - 1 && isTyping && {
                                            borderRight: '2px solid', // Blinking cursor effect
                                            borderColor: darkTheme.palette.primary.main,
                                            animation: 'blink-caret 0.75s step-end infinite',
                                        }),
                                    }}
                                >
                                    {line.type === 'gemini' && index === output.length - 1 && isTyping ? typingResponse : line.text}
                                </Typography>
                            ))}
                            {isLoading && (
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'info.main' }}>
                                    <CircularProgress size={16} sx={{ mr: 1 }} color="primary" />
                                    <Typography variant="body2" sx={{ animation: 'pulse 1.5s infinite' }}>Thinking...</Typography>
                                </Box>
                            )}
                            {/* Keyframe for blinking caret */}
                            <style>{`
                                @keyframes blink-caret {
                                    from, to { border-color: transparent }
                                    50% { border-color: ${darkTheme.palette.primary.main} }
                                }
                                @keyframes pulse {
                                    0% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                    100% { opacity: 1; }
                                }
                            `}</style>
                        </Box>

                        {/* Terminal Input */}
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                p: 2,
                                borderTop: '1px solid',
                                borderColor: 'grey.700',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" sx={{ color: 'success.main', mr: 1 }}>
                                user@gemini-cli:~$
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your command or prompt here..."
                                disabled={isLoading}
                                autoFocus
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'transparent',
                                        '& fieldset': {
                                            borderColor: 'transparent', // Hide default border
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'transparent', // Hide border on hover
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'transparent', // Hide border on focus
                                            boxShadow: `0 0 0 2px ${darkTheme.palette.primary.main}`, // Custom focus ring
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'text.primary',
                                        p: 1, // Adjust padding
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'text.secondary',
                                        opacity: 1, // Ensure placeholder is visible
                                        fontFamily: 'Inter, monospace',
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isLoading}
                                sx={{
                                    ml: 1,
                                    px: 2,
                                    py: 1,
                                    background: `linear-gradient(45deg, ${darkTheme.palette.primary.main} 30%, ${darkTheme.palette.primary.dark} 90%)`, // Gradient button
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)', // Enhanced shadow
                                    '&:hover': {
                                        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4)', // Deeper shadow on hover
                                        background: `linear-gradient(45deg, ${darkTheme.palette.primary.light} 30%, ${darkTheme.palette.primary.main} 90%)`,
                                        transform: 'translateY(-2px)', // Slight lift
                                    },
                                }}
                            >
                                Send
                            </Button>
                        </Box>
                    </Paper>
                ) : (
                    <Paper
                        elevation={10}
                        sx={{
                            width: '100%',
                            maxWidth: '400px',
                            p: 4,
                            bgcolor: 'background.paper',
                            borderRadius: '12px',
                            boxShadow: '0px 15px 40px rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: 'center',
                        }}
                    >
                        <TerminalIcon size={48} color={darkTheme.palette.primary.main} />
                        <Typography variant="h5" color="text.primary" mb={2}>
                            {isLoginMode ? 'Login' : 'Sign Up'}
                        </Typography>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ bgcolor: 'transparent' }}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ bgcolor: 'transparent' }}
                        />
                        {authError && (
                            <Typography color="error.main" variant="body2">
                                {authError}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleAuth}
                            disabled={isLoading}
                            sx={{ mt: 2 }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : (isLoginMode ? 'Login' : 'Sign Up')}
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            sx={{ mt: 1 }}
                        >
                            {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                        </Button>
                    </Paper>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default App;

