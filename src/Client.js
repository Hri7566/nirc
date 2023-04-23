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
    WHOWAS: 'WHOWAS',
    RPL_WELCOME: '001',
    RPL_YOURHOST: '002',
    RPL_CREATED: '003',
    RPL_MYINFO: '004',
    RPL_BOUNCE: '005',
    RPL_ISUPPORT: '005',
    RPL_MAP: '006',
    RPL_MAPEND: '007',
    RPL_SNOMASK: '008',
    RPL_STATEMEMTOT: '009',
    RPL_BOUNCE_010: '010',
    RPL_STATMEM: '010',
    RPL_YOURCOOKIE: '014',
    RPL_MAP_015: '015',
    RPL_MAPMORE: '016',
    RPL_MAPEND_017: '017',
    RPL_YOURID: '042',
    RPL_SAVENICK: '043',
    RPL_ATTEMPTINGJUNC: '050',
    RPL_ATTEMPTINGREROUTE: '051',
    RPL_TRACELINK: '200',
    RPL_TRACECONNECTING: '201',
    RPL_TRACEHANDSHAKE: '202',
    RPL_TRACEUNKNOWN: '203',
    RPL_TRACEOPERATOR: '204',
    RPL_TRACEUSER: '205',
    RPL_TRACESERVER: '206',
    RPL_TRACESERVICE: '207',
    RPL_TRACENEWTYPE: '208',
    RPL_TRACECLASS: '209',
    RPL_TRACERECONNECT: '210',
    RPL_STATS: '210',
    RPL_STATSLINKINFO: '211',
    RPL_STATSCOMMANDS: '212',
    RPL_SERVICEINFO: '231',
    RPL_ENDOFSERVICES: '232',
    RPL_SERVICE: '233',
    RPL_STATSPING: '246',
    RPL_LOCALUSERS: '265',
    RPL_GLOBALUSERS: '266',
    RPL_TEXT: '304',
    RPL_WHOISCHANOP: '316',
    RPL_LISTSTART: '321',
    RPL_LIST: '322',
    RPL_LISTEND: '323',
    RPL_SUMMONING: '342',
    RPL_NAMREPLY: '353',
    RPL_KILLDONE: '361',
    RPL_CLOSING: '362',
    RPL_CLOSEEND: '363',
    RPL_INFOSTART: '373',
    RPL_MOTDSTART: '375',
    RPL_ENDOFMOTD: '376',
    RPL_SPAM: '377',
    RPL_MOTD: '378',
    RPL_MYPORTIS: '384',
    RPL_USERSSTART: '392',
    RPL_USERS: '393',
    RPL_ENDOFUSERS: '394',
    ERR_NOMOTD: '422',
    ERR_YOUWILLBEBANNED: '466',
    ERR_NOSERVICEHOST: '492',
    ERR_VWORLDWARN: '503',
    ERR_WHOTRUNC: '520',
    RPL_DUMPING: '640',
    RPL_DUMPRPL: '641',
    RPL_EODUMP: '642'
});
class Client extends node_events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.socket = new node_net_1.Socket();
        this.ready = false;
        this.connectionAttempts = 0;
        this.bindEventListeners();
    }
    bindEventListeners() {
        this.on(exports.MessageTypes.PING, args => {
            if (this.config.disablePingReply)
                return;
            this.pingReply(...args);
        });
        this.on(exports.MessageTypes.JOIN, args => {
            this.join(args[0]);
        });
        this.on(exports.MessageTypes.ERR_NOMOTD, args => {
            this.becomeReady();
        });
        this.on(exports.MessageTypes.RPL_MOTD, args => {
            this.becomeReady();
        });
        this.on(exports.MessageTypes.RPL_ENDOFMOTD, args => {
            this.becomeReady();
        });
        this.on(exports.MessageTypes.PING, args => {
            this.raw(`${exports.MessageTypes.PONG} ${args}`);
        });
    }
    connect() {
        this.socket = (0, node_net_1.createConnection)(this.config.port, this.config.host);
        this.socket.on('connect', () => {
            // write password
            if (this.config.password) {
                this.raw(`PASS ${this.config.password}`);
            }
            // set user info
            this.raw(`${exports.MessageTypes.NICK} ${this.config.nick}`);
            this.raw(`${exports.MessageTypes.USER} ${this.config.nick} 0 * : ${this.config.fullName}`);
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
            for (let line of text.split('\n')) {
                //? maybe some people need carriage returns, but i'm getting rid of them
                let args = line.split('\r').join('').split(' ');
                if (args[0].startsWith(':')) {
                    // message from specific place?
                    let [place, cmd, ...cmdArgs] = args;
                    argLoop: for (let i = 0; i < cmdArgs.length; i++) {
                        let arg = cmdArgs[i];
                        if (!arg.startsWith(':'))
                            continue;
                        for (let j = i; j < cmdArgs.length; j++) {
                            cmdArgs = [...cmdArgs.slice(0, i), cmdArgs.slice(i, cmdArgs.length).join(' ')];
                        }
                        break argLoop;
                    }
                    // console.log(place, cmd, ...cmdArgs);
                    this.emit(cmd, cmdArgs, place);
                }
                else {
                    // global command?
                    let [cmd, ...cmdArgs] = args;
                    this.emit(cmd, ...cmdArgs);
                }
            }
        });
    }
    disconnect(msg) {
        this.raw(exports.MessageTypes.QUIT, msg);
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
        this.socket.write(data.join(' ') + '\r\n');
    }
    pingReply(...data) {
        this.raw(`${exports.MessageTypes.PONG} ${data.join(' ')}`);
    }
    becomeReady() {
        this.ready = true;
        this.emit('ready', this.ready);
    }
    sendChat(dest, msg) {
        this.raw(`${exports.MessageTypes.PRIVMSG} ${dest} :${msg}`);
    }
}
exports.Client = Client;
