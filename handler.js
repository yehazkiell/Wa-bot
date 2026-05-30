export const handleMessage = async (sock, m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation ||
                 msg.message.extendedTextMessage?.text ||
                 '';
    const command = text.toLowerCase().split(' ')[0];
    const args = text.split(' ').slice(1);

    switch (command) {
        case 'ping':
            await sock.sendMessage(jid, { text: 'pong!' });
            break;

        case 'menu': {
            const menuText = `*Available Commands:*
- ping: Reply with pong
- menu: Show this menu
- event: Send a sample event message
- order: Send a sample order message
- poll: Send a sample poll result message
- call: Send a sample scheduled call message
- album: Send a sample album (ye-baileys exclusive)
- payment: Send a sample payment request (ye-baileys exclusive)
- interactive: Send an interactive message (ye-baileys exclusive)
- product: Send a product catalog message (ye-baileys exclusive)
- react: React to this message
- newsletter: Get metadata of a newsletter (experimental)`;
            await sock.sendMessage(jid, { text: menuText });
            break;
        }

        case 'event':
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
            break;

        case 'order':
            await sock.sendMessage(jid, {
                orderMessage: {
                    id: 'ord-123',
                    title: 'Awesome Item',
                    text: 'This is a sample order message from the bot!',
                    amount: 50000,
                    currency: 'IDR',
                    itemCount: 1,
                    seller: '0@s.whatsapp.net'
                }
            });
            break;

        case 'poll':
            await sock.sendMessage(jid, {
                pollResultMessage: {
                    name: 'Poll Results',
                    pollVotes: [
                        { optionName: 'Option A', optionVoteCount: 10 },
                        { optionName: 'Option B', optionVoteCount: 5 }
                    ]
                }
            });
            break;

        case 'call':
            await sock.sendMessage(jid, {
                callMessage: {
                    title: 'Scheduled Team Meeting',
                    time: Date.now() + 3600000,
                    type: 1
                }
            });
            break;

        case 'album':
            await sock.sendMessage(jid, {
                albumMessage: [
                    { image: { url: 'https://picsum.photos/200' }, caption: 'Image 1' },
                    { image: { url: 'https://picsum.photos/201' }, caption: 'Image 2' }
                ]
            });
            break;

        case 'payment':
            await sock.sendMessage(jid, {
                requestPaymentMessage: {
                    amount: 100000,
                    currency: 'IDR',
                    note: 'Please pay for the items!',
                    expiry: Date.now() + 86400000
                }
            });
            break;

        case 'interactive':
            await sock.sendMessage(jid, {
                interactiveMessage: {
                    body: { text: 'This is an interactive message!' },
                    footer: { text: 'Ye-Baileys' },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'Ping',
                                    id: 'ping'
                                })
                            }
                        ]
                    }
                }
            });
            break;

        case 'product':
            await sock.sendMessage(jid, {
                productMessage: {
                    title: 'Ye-Baileys Pro',
                    description: 'The ultimate WhatsApp bot library',
                    thumbnail: { url: 'https://picsum.photos/300' },
                    productId: 'pro-1',
                    retailerId: 'ye-baileys-shop',
                    url: 'https://github.com/yehazkiell/ye-baileys',
                    body: 'Get it now for a limited time!',
                    footer: 'Quality Guaranteed'
                }
            });
            break;

        case 'react':
            await sock.sendMessage(jid, {
                react: {
                    text: '🚀',
                    key: msg.key
                }
            });
            break;

        case 'newsletter': {
            const newsletterJid = args[0];
            if (!newsletterJid) {
                await sock.sendMessage(jid, { text: 'Usage: newsletter <jid>' });
                break;
            }
            try {
                const metadata = await sock.newsletterMetadata('jid', newsletterJid);
                await sock.sendMessage(jid, { text: `*Newsletter Info:*\nName: ${metadata.name}\nDescription: ${metadata.description}\nSubscribers: ${metadata.subscribers}` });
            } catch (e) {
                await sock.sendMessage(jid, { text: 'Error fetching newsletter metadata. Make sure the JID is correct.' });
            }
            break;
        }

        default:
            // Optional: handle unknown commands
            break;
    }
};
