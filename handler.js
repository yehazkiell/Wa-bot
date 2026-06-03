import { getContentType } from 'ye-baileys';
import { config } from './config.js';
import * as googleTTS from 'google-tts-api';

const startTime = Date.now();
const rateLimitMap = new Map();

export const handleMessage = async (sock, m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;

        // Rate Limiter
        const now = Date.now();
        const lastMsgTime = rateLimitMap.get(jid) || 0;
        if (now - lastMsgTime < 1000) { // 1 second cooldown
            console.log(`[RATE-LIMIT] Ignoring message from ${jid}`);
            return;
        }
        rateLimitMap.set(jid, now);

        const type = getContentType(msg.message);
        let rawText = '';
        if (type === 'conversation') {
            rawText = msg.message.conversation;
        } else if (type === 'extendedTextMessage') {
            rawText = msg.message.extendedTextMessage.text;
        } else if (type === 'buttonsResponseMessage') {
            rawText = msg.message.buttonsResponseMessage.selectedButtonId;
        } else if (type === 'listResponseMessage') {
            rawText = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (type === 'interactiveResponseMessage') {
            try {
                const resp = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
                rawText = resp.id || '';
            } catch (e) {}
        }

        const text = rawText.trim().replace(/\s+/g, ' ');
        if (!text) return;

        if (!text.startsWith(config.prefix)) return;

        console.log(`[COMMAND] ${jid}: ${text}`);

        const parts = text.slice(config.prefix.length).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'halo':
            case 'hi':
                await sock.sendMessage(jid, { text: 'Halo! Saya adalah Ye-Baileys Ultimate Bot. Ada yang bisa saya bantu?' });
                break;

            case 'ping':
                await sock.sendMessage(jid, { text: 'pong!' });
                break;

            case 'status': {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                await sock.sendMessage(jid, { text: `*Ye-Baileys Ultimate Status:*
Uptime: ${hours}h ${minutes}m ${seconds}s
Prefix: ${config.prefix}
Anti-Delete: Enabled
Rate-Limiter: Enabled (1s)` });
                break;
            }

            case 'menu': {
                const menuText = `*Ye-Baileys Ultimate Menu:*
- .halo: Sapa bot
- .ping: Cek koneksi
- .status: Status bot
- .tts <teks>: Text to Speech
- .kirim emoji: Kirim emoji random
- .event: Pesan Event
- .order: Pesan Order
- .poll: Pesan Poll
- .call: Pesan Panggilan
- .album: Pesan Album
- .payment: Request Payment
- .interactive: Pesan Tombol
- .product: Pesan Produk
- .react: Reaksi emoji
- .newsletter <jid>: Info Newsletter`;
                await sock.sendMessage(jid, { text: menuText });
                break;
            }

            case 'kirim':
                if (args[0] === 'emoji') {
                    const emojis = ['🚀', '🤖', '🔥', '✨', '⭐'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await sock.sendMessage(jid, { text: randomEmoji });
                }
                break;

            case 'tts': {
                const ttsText = args.join(' ');
                if (!ttsText) {
                    await sock.sendMessage(jid, { text: 'Usage: .tts <text>' });
                    break;
                }
                const url = googleTTS.getAudioUrl(ttsText, { lang: 'id', slow: false, host: 'https://translate.google.com' });
                await sock.sendMessage(jid, { audio: { url: url }, mimetype: 'audio/mp4', ptt: true });
                break;
            }

            case 'event':
                await sock.sendMessage(jid, {
                    eventMessage: {
                        name: 'Ultimate Meetup',
                        description: 'Ye-Baileys Ultimate special event!',
                        location: { degreesLatitude: -6.2, degreesLongitude: 106.81, name: 'Jakarta' },
                        startTime: Date.now() + 86400000
                    }
                });
                break;

            case 'order':
                await sock.sendMessage(jid, {
                    orderMessage: {
                        id: 'ult-123',
                        title: 'Ultimate License',
                        text: 'Unlock all features!',
                        amount: 99000,
                        currency: 'IDR',
                        itemCount: 1,
                        seller: config.owner
                    }
                });
                break;

            case 'poll':
                await sock.sendMessage(jid, {
                    pollResultMessage: {
                        name: 'Ultimate Choice',
                        pollVotes: [{ optionName: 'Yes', optionVoteCount: 100 }, { optionName: 'No', optionVoteCount: 0 }]
                    }
                });
                break;

            case 'album':
                await sock.sendMessage(jid, {
                    albumMessage: [
                        { image: { url: 'https://picsum.photos/200' }, caption: 'Cool 1' },
                        { image: { url: 'https://picsum.photos/201' }, caption: 'Cool 2' }
                    ]
                });
                break;

            case 'payment':
                await sock.sendMessage(jid, {
                    requestPaymentMessage: {
                        amount: 50000,
                        currency: 'IDR',
                        note: 'Support the developer!',
                        expiry: Date.now() + 86400000
                    }
                });
                break;

            case 'interactive':
                await sock.sendMessage(jid, {
                    interactiveMessage: {
                        body: { text: 'Welcome to Ultimate Edition!' },
                        footer: { text: 'Ye-Baileys' },
                        nativeFlowMessage: {
                            buttons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Ping', id: '.ping' }) }]
                        }
                    }
                });
                break;

            case 'product':
                await sock.sendMessage(jid, {
                    productMessage: {
                        title: 'Ye-Baileys Ultimate',
                        description: 'Pro level automation',
                        thumbnail: { url: 'https://picsum.photos/300' },
                        productId: 'ult-1',
                        retailerId: 'ye-baileys',
                        url: 'https://github.com/yehazkiell/ye-baileys',
                        body: 'Premium features included.',
                        footer: 'Ultimate Series'
                    }
                });
                break;

            case 'react':
                await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } });
                break;

            case 'newsletter': {
                const newsletterJid = args[0];
                if (!newsletterJid) {
                    await sock.sendMessage(jid, { text: 'Usage: .newsletter <jid>' });
                    break;
                }
                try {
                    const metadata = await sock.newsletterMetadata('jid', newsletterJid);
                    await sock.sendMessage(jid, { text: `*Newsletter Info:*\nName: ${metadata.name}\nDescription: ${metadata.description}\nSubscribers: ${metadata.subscribers}` });
                } catch (e) {
                    await sock.sendMessage(jid, { text: 'Error fetching newsletter metadata.' });
                }
                break;
            }
        }
    } catch (e) {
        console.error('Error handling message:', e);
    }
};
