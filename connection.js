import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay
} from 'ye-baileys';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { config } from './config.js';
import { handleMessage } from './handler.js';
import readline from 'readline';

function createInterface() {
    return readline.createInterface({ input: process.stdin, output: process.stdout });
}

const question = (query) => {
    const rl = createInterface();
    return new Promise((resolve) => rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    }));
};

const msgRetryCounterCache = {};

export async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);

        let usePairingCode = 'n';
        if (!state.creds.me) {
            usePairingCode = await question('Do you want to use Pairing Code? (y/n): ');
        }

        const logger = {
            level: 'info',
            silent: () => {},
            info: (...args) => console.log('[INFO]', ...args),
            error: (...args) => console.error('[ERROR]', ...args),
            debug: () => {},
            warn: (...args) => console.warn('[WARN]', ...args),
            trace: () => {},
            child: () => logger
        };

        const sock = makeWASocket({
            printQRInTerminal: usePairingCode.toLowerCase() !== 'y',
            auth: state,
            logger: logger,
            msgRetryCounterCache
        });

        if (usePairingCode.toLowerCase() === 'y' && !sock.authState.creds.registered) {
            const phoneNumber = await question('Please enter your phone number (with country code, e.g., 628xxx): ');
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`Your pairing code: ${code}`);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && usePairingCode.toLowerCase() !== 'y') {
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const error = lastDisconnect?.error;
                const statusCode = error instanceof Boom ? error.output?.statusCode : null;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log(`Connection closed: ${error?.message || 'unknown error'}. Reconnecting in 5s: ${shouldReconnect}`);

                if (shouldReconnect) {
                    await delay(5000);
                    connectToWhatsApp();
                }
            } else if (connection === 'open') {
                console.log('Bot is now online!');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', (m) => handleMessage(sock, m));

        // Anti-Delete Implementation
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update.message === null) {
                    const key = update.key;
                    console.log(`[ANTI-DELETE] Message deleted from ${key.remoteJid}, ID: ${key.id}`);
                    // Note: Real anti-delete would require message store to retrieve the deleted content.
                }
            }
        });

        return sock;
    } catch (e) {
        console.error('Connection logic error:', e);
    }
}
