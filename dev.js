const IRC = require('.');

const cl = new IRC.Client({
    host: 'raspberrypi',
    port: 6697,
    fullName: 'testbot',
    nick: 'testbot'
});

cl.connect();

cl.socket.on('data', data => {
    // console.log(data.toString());
});

cl.on(IRC.ClientEvents.Ready, () => {
    console.log('online');
});

cl.on(IRC.ClientEvents.Error, err => {
    console.error(err);
});

cl.on(IRC.MessageTypes.PRIVMSG, args => {
    console.log(...args);
});
