import { getContentType } from 'ye-baileys';
import { config } from './config.js';
import * as googleTTS from 'google-tts-api';
import speed from 'performance-now';

const startTime = Date.now();
const rateLimitMap = new Map();
let isPublic = true;

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? d + (d === 1 ? " d, " : " d, ") : "";
    const hDisplay = h > 0 ? h + (h === 1 ? " h, " : " h, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " m, " : " m, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " s" : " s") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

export const handleMessage = async (sock, m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;
        const isOwner = sender === config.owner || sender.split('@')[0] === config.owner.split('@')[0];

        if (!isPublic && !isOwner) return;

        // Rate Limiter
        const now = Date.now();
        const lastMsgTime = rateLimitMap.get(jid) || 0;
        if (now - lastMsgTime < 1000) return;
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
        if (!text || !text.startsWith(config.prefix)) return;

        console.log(`[COMMAND] ${jid}: ${text}`);

        const parts = text.slice(config.prefix.length).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        const prefix = config.prefix;

        switch (command) {
            case 'allmenu': {
                const timestampe = speed();
                const latensie = speed() - timestampe;
                const menu = `
*⟨ INFO BOT ⟩*
▪️ *System*: ${config.botName}
▪️ *Build*: C1.3.0
▪️ *Latency*: ${latensie.toFixed(4)}ms
▪️ *Uptime*: ${runtime(process.uptime())}

List Group
▫️ ${prefix}leavegc
▫️ ${prefix}open
▫️ ${prefix}close
▫️ ${prefix}hidetag
▫️ ${prefix}everyone

List Tools
▫️ ${prefix}tts <teks>
▫️ ${prefix}cekidgc
▫️ ${prefix}status
▫️ ${prefix}react

List Ye-Baileys
▫️ ${prefix}event
▫️ ${prefix}order
▫️ ${prefix}poll
▫️ ${prefix}album
▫️ ${prefix}payment
▫️ ${prefix}interactive
▫️ ${prefix}product
▫️ ${prefix}newsletter <jid>

List Owner
▫️ ${prefix}self
▫️ ${prefix}public
`;
                await sock.sendMessage(jid, { text: menu });
                break;
            }

            // --- Group Management ---
            case 'leavegc':
                if (!isGroup) return sock.sendMessage(jid, { text: 'Hanya bisa di grup!' });
                if (!isOwner) return sock.sendMessage(jid, { text: 'Hanya Owner!' });
                await sock.sendMessage(jid, { text: 'Sayonara!' });
                await sock.groupLeave(jid);
                break;

            case 'open':
                if (!isGroup) return sock.sendMessage(jid, { text: 'Hanya bisa di grup!' });
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { text: 'Grup dibuka!' });
                break;

            case 'close':
                if (!isGroup) return sock.sendMessage(jid, { text: 'Hanya bisa di grup!' });
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { text: 'Grup ditutup!' });
                break;

            case 'hidetag':
            case 'everyone':
                if (!isGroup) return sock.sendMessage(jid, { text: 'Hanya bisa di grup!' });
                try {
                    const metadata = await sock.groupMetadata(jid);
                    const participants = metadata.participants.map(p => p.id);
                    await sock.sendMessage(jid, { text: args.join(' ') || 'Hello everyone!', mentions: participants });
                } catch (e) {
                    await sock.sendMessage(jid, { text: 'Gagal mengambil metadata grup.' });
                }
                break;

            // --- Owner Commands ---
            case 'self':
                if (!isOwner) return;
                isPublic = false;
                await sock.sendMessage(jid, { text: 'Bot sekarang mode Self.' });
                break;

            case 'public':
                if (!isOwner) return;
                isPublic = true;
                await sock.sendMessage(jid, { text: 'Bot sekarang mode Publik.' });
                break;

            // --- Tools ---
            case 'cekidgc':
                await sock.sendMessage(jid, { text: `ID Grup: ${jid}` });
                break;

            case 'status':
                await sock.sendMessage(jid, { text: `*Status Bot:* Online\n*Uptime:* ${runtime(process.uptime())}` });
                break;

            case 'tts': {
                const ttsText = args.join(' ');
                if (!ttsText) return sock.sendMessage(jid, { text: 'Usage: .tts <text>' });
                const url = googleTTS.getAudioUrl(ttsText, { lang: 'id', slow: false, host: 'https://translate.google.com' });
                await sock.sendMessage(jid, { audio: { url: url }, mimetype: 'audio/mp4', ptt: true });
                break;
            }

            // --- Ye-Baileys Exclusive ---
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
                if (!newsletterJid) return sock.sendMessage(jid, { text: 'Usage: .newsletter <jid>' });
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
