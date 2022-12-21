"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.MessageTypes = exports.ClientEvents = void 0;
const node_events_1 = require("node:events");
const node_net_1 = require("node:net");
exports.ClientEvents = Object.seal({
    Error: 'error',
    Ready: 'ready'
});
exports.MessageTypes = Object.seal({
    ADMIN: 'ADMIN',
    AWAY: 'AWAY',
    CNOTICE: 'CNOTICE',
    CPRIVMSG: 'CPRIVMSG',
    CONNECT: 'CONNECT',
    DIE: 'DIE',
    ENCAP: 'ENCAP',
    ERROR: 'ERROR',
    HELP: 'HELP',
    INFO: 'INFO',
    INVITE: 'INVITE',
    ISON: 'ISON',
    JOIN: 'JOIN',
    KICK: 'KICK',
    KILL: 'KILL',
    KNOCK: 'KNOCK',
    LINKS: 'LINKS',
    LIST: 'LIST',
    LUSERS: 'LUSERS',
    MODE: 'MODE',
    MOTD: 'MOTD',
    NAMES: 'NAMES',
    NICK: 'NICK',
    NOTICE: 'NOTICE',
    OPER: 'OPER',
    PART: 'PART',
    PASS: 'PASS',
    PING: 'PING',
    PONG: 'PONG',
    PRIVMSG: 'PRIVMSG',
    QUIT: 'QUIT',
    REHASH: 'REHASH',
    RULES: 'RULES',
    SERVER: 'SERVER',
    SERVICE: 'SERVICE',
    SERVLIST: 'SERVLIST',
    SQUERY: 'SQUERY',
    SQUIT: 'SQUIT',
    SETNAME: 'SETNAME',
    SILENCE: 'SILENCE',
    STATS: 'STATS',
    SUMMON: 'SUMMON',
    TIME: 'TIME',
    TOPIC: 'TOPIC',
    TRACE: 'TRACE',
    USER: 'USER',
    USERHOST: 'USERHOST',
    USERIP: 'USERIP',
    USERS: 'USERS',
    VERSION: 'VERSION',
    WALLOPS: 'WALLOPS',
    WATCH: 'WATCH',
    WHO: 'WHO',
    WHOIS: 'WHOIS',
    WHOWAS: 'WHOWAS'
});
class Client extends node_events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.socket = new node_net_1.Socket();
        this.connectionAttempts = 0;
        this.bindEventListeners();
    }
    bindEventListeners() {
        this.on(exports.MessageTypes.PING, args => {
            this.pingReply(...args);
        });
        this.on(exports.MessageTypes.JOIN, args => {
            this.join(args[0]);
        });
    }
    connect() {
        this.socket = (0, node_net_1.createConnection)(this.config.port, this.config.host);
        this.socket.on('connect', () => {
            // write password
            if (this.config.password) {
                this.raw(`PASS ${this.config.password}\r\n`);
            }
            // set user info
            this.raw(`${exports.MessageTypes.NICK} ${this.config.nick}\r\n`);
            this.raw(`${exports.MessageTypes.USER} ${this.config.nick} 0 * : ${this.config.fullName}\r\n`);
        });
        this.socket.on('error', (...args) => {
            this.emit(exports.ClientEvents.Error, args);
        });
        this.socket.on('close', data => {
            this.connectionAttempts++;
            setTimeout(() => {
                this.connect();
            }, this.connectionAttempts * 500);
        });
        this.socket.on('data', data => {
            let text = data.toString();
            if (!text)
                return;
            let args = text.split(' ');
            if (args[0].startsWith(':')) {
                // server command?
                let [server, cmd, ...cmdArgs] = args;
                console.log(cmd, ...cmdArgs);
                this.emit(cmd, cmdArgs, server);
            }
            else {
                // global command?
                let [cmd, ...cmdArgs] = args;
                this.emit(cmd, ...cmdArgs);
            }
            let msg = {};
        });
    }
    disconnect() {
        this.raw(exports.MessageTypes.QUIT);
        this.socket.end();
    }
    join(ch) {
        if (!this.socket.closed) {
            this.raw(`${exports.MessageTypes.JOIN} ${ch}`);
        }
    }
    leave(ch) {
        if (!ch.startsWith('#'))
            ch = `#${ch}`;
        if (!this.socket.closed) {
            this.raw(`${exports.MessageTypes.PART} ${ch}`);
        }
    }
    raw(...data) {
        this.socket.write(data.join(' '));
    }
    pingReply(...data) {
        this.raw(`${exports.MessageTypes.PONG} ${data.join(' ')}`);
    }
}
exports.Client = Client;
