import { getContentType, downloadContentFromMessage } from 'ye-baileys';
import { config } from './config.js';
import * as googleTTS from 'google-tts-api';
import speed from 'performance-now';
import fs from 'fs/promises';

const startTime = Date.now();
const rateLimitMap = new Map();
let isPublic = true;

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
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
        const quoted = type === 'extendedTextMessage' ? msg.message.extendedTextMessage.contextInfo?.quotedMessage : null;
        const quotedType = quoted ? getContentType(quoted) : null;

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
▪️ *Uptime*: ${runtime((Date.now() - startTime) / 1000)}

List Group
▫️ ${prefix}leavegc
▫️ ${prefix}open
▫️ ${prefix}close
▫️ ${prefix}hidetag
▫️ ${prefix}everyone
▫️ ${prefix}welcome
▫️ ${prefix}antilinkgc

List Download
▫️ ${prefix}ai
▫️ ${prefix}spotify
▫️ ${prefix}ytmp3
▫️ ${prefix}ytmp4

List Maker
▫️ ${prefix}sticker
▫️ ${prefix}toimg
▫️ ${prefix}brat
▫️ ${prefix}animbrat

List Game
▫️ ${prefix}tebak lagu
▫️ ${prefix}kuis math

List Owner
▫️ ${prefix}self
▫️ ${prefix}public
▫️ ${prefix}join

List Tools
▫️ ${prefix}translate
▫️ ${prefix}cekidch
▫️ ${prefix}cekidgc
▫️ ${prefix}tts
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
`;
                await sock.sendMessage(jid, { text: menu });
                break;
            }

            // --- Group ---
            case 'leavegc':
                if (!isOwner) return;
                await sock.sendMessage(jid, { text: 'Leaving group...' });
                await sock.groupLeave(jid);
                break;
            case 'open':
                if (!isGroup) return;
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { text: 'Grup dibuka.' });
                break;
            case 'close':
                if (!isGroup) return;
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { text: 'Grup ditutup.' });
                break;
            case 'hidetag':
            case 'everyone': {
                if (!isGroup) return;
                const meta = await sock.groupMetadata(jid);
                const users = meta.participants.map(p => p.id);
                await sock.sendMessage(jid, { text: args.join(' ') || 'Tag all', mentions: users });
                break;
            }

            // --- Maker ---
            case 'sticker':
            case 's': {
                const isMedia = (type === 'imageMessage' || type === 'videoMessage');
                const isQuotedMedia = quoted && (quotedType === 'imageMessage' || quotedType === 'videoMessage');
                if (isMedia || isQuotedMedia) {
                    const messageToDownload = isMedia ? msg.message : quoted;
                    const mediaType = isMedia ? type : quotedType;
                    const stream = await downloadContentFromMessage(messageToDownload[mediaType], mediaType.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    await sock.sendMessage(jid, { sticker: buffer });
                } else {
                    await sock.sendMessage(jid, { text: 'Kirim gambar dengan caption .sticker' });
                }
                break;
            }
            case 'toimg': {
                if (quotedType === 'stickerMessage') {
                    const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    await sock.sendMessage(jid, { image: buffer, caption: 'Done' });
                }
                break;
            }

            // --- Download ---
            case 'ai': {
                const q = args.join(' ');
                if (!q) return sock.sendMessage(jid, { text: 'Mau tanya apa?' });
                await sock.sendMessage(jid, { text: '[AI Mode] Processing...' });
                await sock.sendMessage(jid, { text: `Ini adalah jawaban untuk: ${q}` });
                break;
            }
            case 'spotify':
            case 'ytmp3':
            case 'ytmp4':
                await sock.sendMessage(jid, { text: 'Fitur download sedang dalam pengembangan (membutuhkan API external).' });
                break;

            // --- Tools ---
            case 'translate':
                await sock.sendMessage(jid, { text: 'Gunakan: .translate <lang> <teks>' });
                break;
            case 'cekidgc':
                await sock.sendMessage(jid, { text: `ID Grup: ${jid}` });
                break;
            case 'cekidch':
                await sock.sendMessage(jid, { text: `ID Chat: ${jid}` });
                break;
            case 'tts': {
                const t = args.join(' ');
                if (!t) return;
                const url = googleTTS.getAudioUrl(t, { lang: 'id', slow: false, host: 'https://translate.google.com' });
                await sock.sendMessage(jid, { audio: { url }, mimetype: 'audio/mp4', ptt: true });
                break;
            }
            case 'status':
                await sock.sendMessage(jid, { text: `Bot Aktif! Uptime: ${runtime((Date.now() - startTime) / 1000)}` });
                break;
            case 'react':
                await sock.sendMessage(jid, { react: { text: '⭐', key: msg.key } });
                break;

            // --- Owner ---
            case 'self':
                if (!isOwner) return;
                isPublic = false;
                await sock.sendMessage(jid, { text: 'Mode Self aktif.' });
                break;
            case 'public':
                if (!isOwner) return;
                isPublic = true;
                await sock.sendMessage(jid, { text: 'Mode Publik aktif.' });
                break;

            // --- Ye-Baileys ---
            case 'event':
                await sock.sendMessage(jid, { eventMessage: { name: 'Bot Event', description: 'Test', location: { degreesLatitude: 0, degreesLongitude: 0, name: 'Earth' }, startTime: Date.now() + 3600000 } });
                break;
            case 'order':
                await sock.sendMessage(jid, { orderMessage: { id: '1', title: 'Test Order', text: 'Sample', amount: 1000, currency: 'IDR', itemCount: 1, seller: config.owner } });
                break;
            case 'poll':
                await sock.sendMessage(jid, { pollResultMessage: { name: 'Poll', pollVotes: [{ optionName: 'A', optionVoteCount: 1 }] } });
                break;
            case 'album':
                await sock.sendMessage(jid, { albumMessage: [{ image: { url: 'https://picsum.photos/200' }, caption: '1' }, { image: { url: 'https://picsum.photos/201' }, caption: '2' }] });
                break;
            case 'payment':
                await sock.sendMessage(jid, { requestPaymentMessage: { amount: 1000, currency: 'IDR', note: 'Test', expiry: Date.now() + 3600000 } });
                break;
            case 'interactive':
                await sock.sendMessage(jid, { interactiveMessage: { body: { text: 'Menu' }, footer: { text: 'Bot' }, nativeFlowMessage: { buttons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Ping', id: '.ping' }) }] } } });
                break;
            case 'product':
                await sock.sendMessage(jid, { productMessage: { title: 'Bot', description: 'Best', thumbnail: { url: 'https://picsum.photos/200' }, productId: '1', retailerId: 'bot', url: 'https://github.com', body: 'Buy', footer: 'Now' } });
                break;
            case 'newsletter': {
                if (!args[0]) return;
                try {
                    const meta = await sock.newsletterMetadata('jid', args[0]);
                    await sock.sendMessage(jid, { text: `Newsletter: ${meta.name}` });
                } catch (e) {
                    await sock.sendMessage(jid, { text: 'Gagal.' });
                }
                break;
            }
        }
    } catch (e) {
        console.error('Handler Error:', e);
    }
};
