import { EventEmitter } from 'node:events';
import { Socket, createConnection } from 'node:net';

export interface IRCConfig {
    host: string;
    port: number;
    password?: string;
    nick: string;
    fullName: string;
    disablePingReply?: boolean;
}

export const ClientEvents = Object.seal({
    Error: 'error',
    Ready: 'ready'
});

export const MessageTypes = Object.seal({
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

export type ChannelName = `#${string}`;

export class Client extends EventEmitter {
    public socket: Socket = new Socket();
    public ready: boolean = false;
    public pingInterval?: NodeJS.Timer;

    constructor(public config: IRCConfig) {
        super();
        this.bindEventListeners();
    }

    private bindEventListeners() {
        this.on(MessageTypes.PING, args => {
            if (this.config.disablePingReply) return;
            this.pingReply(...args);
        });

        this.on(MessageTypes.JOIN, args => {
            this.join(args[0]);
        });

        this.on(MessageTypes.ERR_NOMOTD, args => {
            this.becomeReady();
        });

        this.on(MessageTypes.RPL_MOTD, args => {
            this.becomeReady();
        });

        this.on(MessageTypes.RPL_ENDOFMOTD, args => {
            this.becomeReady();
        });
        
        this.on(MessageTypes.PING, args => {
            this.raw(`${MessageTypes.PONG} ${args}`);
        });
    }

    public connectionAttempts = 0;

    public connect(): void {
        this.socket = createConnection(this.config.port, this.config.host);

        this.socket.on('connect', () => {
            // write password
            if (this.config.password) {
                this.raw(`PASS ${this.config.password}`);
            }

            // set user info
            this.raw(`${MessageTypes.NICK} ${this.config.nick}`);
            this.raw(`${MessageTypes.USER} ${this.config.nick} 0 * : ${this.config.fullName}`);
        });

        this.socket.on('error', (...args) => {
            this.emit(ClientEvents.Error, args);
        });

        this.socket.on('close', data => {
            this.connectionAttempts++;

            setTimeout(() => {
                this.connect();
            }, this.connectionAttempts * 500);
        });

        
        this.socket.on('data', data => {
            let text: string = data.toString();
            if (!text) return;

            for (let line of text.split('\n')) {
                //? maybe some people need carriage returns, but i'm getting rid of them
                let args = line.split('\r').join('').split(' ');
            
                if (args[0].startsWith(':')) {
                    // message from specific place?
                    let [place, cmd, ...cmdArgs] = args;

                    argLoop:
                    for (let i = 0; i < cmdArgs.length; i++) {
                        let arg = cmdArgs[i];
                        if (!arg.startsWith(':')) continue;
                        
                        for (let j = i; j < cmdArgs.length; j++) {
                            cmdArgs = [...cmdArgs.slice(0, i), cmdArgs.slice(i, cmdArgs.length).join(' ')];
                        }

                        break argLoop;
                    }

                    // console.log(place, cmd, ...cmdArgs);
                    this.emit(cmd, cmdArgs, place);
                } else {
                    // global command?
                    let [cmd, ...cmdArgs] = args;
                    this.emit(cmd, ...cmdArgs);
                }
            }
        });
    }

    public disconnect(msg: string): void {
        this.raw(MessageTypes.QUIT, msg);
        this.socket.end();
    }

    public join(ch: ChannelName): void {
        if (!this.socket.closed) {
            this.raw(`${MessageTypes.JOIN} ${ch}`);
        }
    }

    public leave(ch: ChannelName): void {
        if (!ch.startsWith('#')) ch = `#${ch}`;
        if (!this.socket.closed) {
            this.raw(`${MessageTypes.PART} ${ch}`);
        }
    }

    public raw(...data: string[]) {
        this.socket.write(data.join(' ') + '\r\n');
    }

    public pingReply(...data: string[]) {
        this.raw(`${MessageTypes.PONG} ${data.join(' ')}`);
    }

    private becomeReady() {
        this.ready = true;
        this.emit('ready', this.ready);
    }

    public sendChat(dest: string, msg: string) {
        this.raw(`${MessageTypes.PRIVMSG} ${dest} :${msg}`);
    }
}
