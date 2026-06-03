import { connectToWhatsApp } from './connection.js';

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

connectToWhatsApp().catch(err => console.error('Error starting bot:', err));
