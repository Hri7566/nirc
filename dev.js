const IRC = require('.');

const cl = new IRC.Client({
    host: 'raspberrypi',
    port: 6697,
    fullName: 'testbot',
    nick: 'testbot'
});

cl.connect();

cl.on(IRC.ClientEvents.Ready, () => {
    console.log('Online, joining channels...');
    cl.join('#mpp');
});

cl.on(IRC.ClientEvents.Error, err => {
    console.error(err);
});

cl.on(IRC.MessageTypes.PRIVMSG, (args, sender) => {
    let ch = args[0];
    let msg = args[args.length - 1].split(':').join('');
    let nick = sender.split('!')[0].split(':').join('');
    let user = sender.split('!')[1];
    let host = sender.split('@')[1];

    console.log(`[${ch}] <${nick}>:`, msg);

    if (msg == '!about') {
        cl.sendChat(ch, 'This bot was made using NodeJS.');
    }
});

cl.on(IRC.MessageTypes.RPL_NAMREPLY, args => {
    console.log('Online users:', args[args.length - 1].split(':').join(''));
});
