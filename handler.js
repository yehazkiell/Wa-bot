import { getContentType, downloadContentFromMessage } from 'ye-baileys';
import { config } from './config.js';
import * as googleTTS from 'google-tts-api';
import speed from 'performance-now';

const startTime = Date.now();
const rateLimitMap = new Map();
let isPublic = true;

/**
 * Fungsi untuk memformat waktu aktif bot
 */
function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d} hari, ${h} jam, ${m} menit, ${s} detik`;
}

/**
 * Handler utama untuk pesan masuk
 */
export const handleMessage = async (sock, m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || jid;
        const isGroup = jid.endsWith('@g.us');
        const isOwner = sender.startsWith(config.owner.split('@')[0]);

        // Cek mode publik/self
        if (!isPublic && !isOwner) return;

        // Anti-spam (Rate Limiter 1 detik)
        const now = Date.now();
        if (now - (rateLimitMap.get(jid) || 0) < 1000) return;
        rateLimitMap.set(jid, now);

        // Ambil tipe dan isi teks pesan
        const type = getContentType(msg.message);
        const quoted = type === 'extendedTextMessage' ? msg.message.extendedTextMessage.contextInfo?.quotedMessage : null;
        const quotedType = quoted ? getContentType(quoted) : null;

        let body = '';
        if (type === 'conversation') body = msg.message.conversation;
        else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
        else if (type === 'buttonsResponseMessage') body = msg.message.buttonsResponseMessage.selectedButtonId;
        else if (type === 'listResponseMessage') body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        else if (type === 'interactiveResponseMessage') {
            const params = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
            body = params.id || '';
        }

        body = body.trim();
        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).split(' ');
        const command = args.shift().toLowerCase();
        const fullText = args.join(' ');
        const prefix = config.prefix;

        console.log(`[COMMAND] ${jid}: ${body}`);

        switch (command) {
            case 'menu': {
                // Menggunakan Interactive Message (Button) khas Ye-Baileys
                await sock.sendMessage(jid, {
                    interactiveMessage: {
                        body: { text: `Halo @${sender.split('@')[0]}! Selamat datang di ${config.botName}.\n\nSilakan pilih menu di bawah ini untuk melihat daftar perintah.` },
                        footer: { text: 'Ye-Baileys Ultimate Edition' },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Daftar Lengkap',
                                        id: `${prefix}allmenu`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Status Bot',
                                        id: `${prefix}status`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Owner',
                                        id: `${prefix}owner`
                                    })
                                }
                            ]
                        },
                        contextInfo: { mentionedJid: [sender] }
                    }
                });
                break;
            }

            case 'allmenu': {
                const uptime = runtime((Date.now() - startTime) / 1000);
                const latensie = (speed() - speed()).toFixed(4); // Simulasi latensi sederhana
                const menuText = `
*⟨ INFO BOT ⟩*
▪️ *System*: ${config.botName}
▪️ *Uptime*: ${uptime}
▪️ *Prefix*: "${prefix}"

*LIST GROUP*
▫️ ${prefix}open / ${prefix}close
▫️ ${prefix}hidetag
▫️ ${prefix}leavegc

*LIST TOOLS*
▫️ ${prefix}sticker (Balas Gambar)
▫️ ${prefix}toimg (Balas Sticker)
▫️ ${prefix}ai <tanya>
▫️ ${prefix}tts <teks>
▫️ ${prefix}cekidgc

*LIST OWNER*
▫️ ${prefix}self / ${prefix}public
▫️ ${prefix}owner
`;
                await sock.sendMessage(jid, { text: menuText });
                break;
            }

            case 'status': {
                await sock.sendMessage(jid, { text: `Bot Aktif!\nUptime: ${runtime((Date.now() - startTime) / 1000)}` });
                break;
            }

            case 'owner': {
                await sock.sendMessage(jid, { text: `Owner Bot: @${config.owner.split('@')[0]}`, mentions: [config.owner] });
                break;
            }

            case 'ai': {
                if (!fullText) return sock.sendMessage(jid, { text: 'Tanya apa?' });
                await sock.sendMessage(jid, { text: `[AI] ${fullText}\n\nRespon: Ini adalah fitur AI simulasi.` });
                break;
            }

            case 'sticker':
            case 's': {
                const isMedia = (type === 'imageMessage' || type === 'videoMessage');
                const isQuotedMedia = quoted && (quotedType === 'imageMessage' || quotedType === 'videoMessage');
                if (isMedia || isQuotedMedia) {
                    const data = isMedia ? msg.message : quoted;
                    const mediaType = isMedia ? type : quotedType;
                    const stream = await downloadContentFromMessage(data[mediaType], mediaType.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    await sock.sendMessage(jid, { sticker: buffer });
                } else {
                    await sock.sendMessage(jid, { text: 'Balas gambar dengan .sticker' });
                }
                break;
            }

            case 'toimg': {
                if (quotedType === 'stickerMessage') {
                    const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    await sock.sendMessage(jid, { image: buffer, caption: 'Done!' });
                }
                break;
            }

            case 'self':
                if (!isOwner) return;
                isPublic = false;
                await sock.sendMessage(jid, { text: 'Mode Self Aktif.' });
                break;

            case 'public':
                if (!isOwner) return;
                isPublic = true;
                await sock.sendMessage(jid, { text: 'Mode Publik Aktif.' });
                break;

            case 'open':
                if (isGroup && isOwner) {
                    await sock.groupSettingUpdate(jid, 'not_announcement');
                    await sock.sendMessage(jid, { text: 'Grup dibuka.' });
                }
                break;

            case 'close':
                if (isGroup && isOwner) {
                    await sock.groupSettingUpdate(jid, 'announcement');
                    await sock.sendMessage(jid, { text: 'Grup ditutup.' });
                }
                break;

            case 'hidetag': {
                if (isGroup && isOwner) {
                    const meta = await sock.groupMetadata(jid);
                    const users = meta.participants.map(p => p.id);
                    await sock.sendMessage(jid, { text: fullText || 'Pemberitahuan!', mentions: users });
                }
                break;
            }

            case 'tts': {
                if (!fullText) return;
                const url = googleTTS.getAudioUrl(fullText, { lang: 'id' });
                await sock.sendMessage(jid, { audio: { url }, mimetype: 'audio/mp4', ptt: true });
                break;
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
};
