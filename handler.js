export const handleMessage = async (sock, m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation ||
                 msg.message.extendedTextMessage?.text ||
                 '';
    const command = text.toLowerCase();

    if (command === 'ping') {
        await sock.sendMessage(jid, { text: 'pong!' });
    } else if (command === 'menu') {
        const menuText = `*Available Commands:*
- ping: Reply with pong
- menu: Show this menu
- event: Send a sample event message
- order: Send a sample order message
- poll: Send a sample poll result message
- call: Send a sample scheduled call message
- album: Send a sample album (ye-baileys exclusive)
- payment: Send a sample payment request (ye-baileys exclusive)
- interactive: Send an interactive message (ye-baileys exclusive)`;
        await sock.sendMessage(jid, { text: menuText });
    } else if (command === 'event') {
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
    } else if (command === 'order') {
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
    } else if (command === 'poll') {
        await sock.sendMessage(jid, {
            pollResultMessage: {
                name: 'Poll Results',
                pollVotes: [
                    { optionName: 'Option A', optionVoteCount: 10 },
                    { optionName: 'Option B', optionVoteCount: 5 }
                ]
            }
        });
    } else if (command === 'call') {
        await sock.sendMessage(jid, {
            callMessage: {
                title: 'Scheduled Team Meeting',
                time: Date.now() + 3600000,
                type: 1
            }
        });
    } else if (command === 'album') {
        await sock.sendMessage(jid, {
            albumMessage: [
                { image: { url: 'https://picsum.photos/200' }, caption: 'Image 1' },
                { image: { url: 'https://picsum.photos/201' }, caption: 'Image 2' }
            ]
        });
    } else if (command === 'payment') {
        await sock.sendMessage(jid, {
            requestPaymentMessage: {
                amount: 100000,
                currency: 'IDR',
                note: 'Please pay for the items!',
                expiry: Date.now() + 86400000
            }
        });
    } else if (command === 'interactive') {
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
    }
};
