import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} from 'ye-baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
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

export async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);

    const usePairingCode = await question('Do you want to use Pairing Code? (y/n): ');

    const sock = makeWASocket({
        printQRInTerminal: usePairingCode.toLowerCase() !== 'y',
        auth: state,
        logger: pino({ level: 'silent' })
    });

    if (usePairingCode.toLowerCase() === 'y' && !sock.authState.creds.registered) {
        const phoneNumber = await question('Please enter your phone number (with country code, e.g., 628xxx): ');
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`Your pairing code: ${code}`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && usePairingCode.toLowerCase() !== 'y') {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', (m) => handleMessage(sock, m));

    return sock;
}
