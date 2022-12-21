import { EventEmitter } from 'node:events';
import { Socket, createConnection } from 'node:net';

export interface IRCConfig {
    host: string;
    port: number;
    password?: string;
    nick: string;
    fullName: string;
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
    WHOWAS: 'WHOWAS'
});

export type ChannelName = `#${string}`;

export class Client extends EventEmitter {
    public socket: Socket = new Socket();

    constructor(public config: IRCConfig) {
        super();
        this.bindEventListeners();
    }

    private bindEventListeners() {
        this.on(MessageTypes.PING, args => {
            this.pingReply(...args);
        });

        this.on(MessageTypes.JOIN, args => {
            this.join(args[0]);
        });
    }

    public connectionAttempts = 0;

    public connect(): void {
        this.socket = createConnection(this.config.port, this.config.host);

        this.socket.on('connect', () => {
            // write password
            if (this.config.password) {
                this.raw(`PASS ${this.config.password}\r\n`);
            }

            // set user info
            this.raw(`${MessageTypes.NICK} ${this.config.nick}\r\n`);
            this.raw(`${MessageTypes.USER} ${this.config.nick} 0 * : ${this.config.fullName}\r\n`);
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

            let args = text.split(' ');
            
            if (args[0].startsWith(':')) {
                // message from specific place?
                let [place, cmd, ...cmdArgs] = args;
                console.log(cmd, ...cmdArgs);

                this.emit(cmd, cmdArgs, place);
            } else {
                // global command?
                let [cmd, ...cmdArgs] = args;
                this.emit(cmd, ...cmdArgs);
            }

            let msg = {
                
            }
        });
    }

    public disconnect(): void {
        this.raw(MessageTypes.QUIT);
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
        this.socket.write(data.join(' '));
    }

    public pingReply(...data: string[]) {
        this.raw(`${MessageTypes.PONG} ${data.join(' ')}`);
    }
}
