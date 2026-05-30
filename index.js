import { connectToWhatsApp } from './connection.js';

connectToWhatsApp().catch(err => console.error('Error starting bot:', err));
