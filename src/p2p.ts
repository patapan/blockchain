import * as WebSocket from 'ws';
import {Server} from 'ws';
import {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain} from './blockchain';

// This variable stores all active sockets for each nodes
const sockets: WebSocket[] = [];

const getSockets = () => sockets;

enum MessageType {
    QUERY_LATEST = 0,
    QUERY_ALL = 1,
    RESPONSE_BLOCKCHAIN = 2,
}

class Message {
    public type: MessageType;
    public data: any;
}

// Setup port to connect nodes
const initP2PServer = (p2pPort: number) => {
    const server: Server = new WebSocket.Server({port: p2pPort});
    server.on('connection', (ws: WebSocket) => {
        initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2pport);
}