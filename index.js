import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} from 'ye-baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { Boom } from '@hapi/boom';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const text = msg.message.conversation ||
                     msg.message.extendedTextMessage?.text ||
                     '';

        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(jid, { text: 'pong!' });
        } else if (text.toLowerCase() === 'event') {
            // Demonstration of custom eventMessage supported by ye-baileys
            await sock.sendMessage(jid, {
                eventMessage: {
                    name: 'Bot Event',
                    description: 'This is a test event from ye-baileys bot!',
                    location: {
                        degreesLatitude: -6.200000,
                        degreesLongitude: 106.816666,
                        name: 'Jakarta, Indonesia'
                    },
                    startTime: Date.now() + 86400000
                }
            });
        }
    });
}

startBot();
