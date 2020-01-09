import * as WebSocket from 'ws';
import {Server} from 'ws';
import {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain} from './blockchain';


// This variable stores all active sockets for each nodes
const sockets: WebSocket[] = [];

const getSockets = () => sockets;

enum MessageType {
    QUERY_LATEST = 0,   // Request Latest Block
    QUERY_ALL = 1,  // Request All blocks  
    RESPONSE_BLOCKCHAIN = 2, // Send blockchain
}

class Message {
    public type: MessageType;
    public data: any;
}

// Setup port to connect nodes with WebSocket 
const initP2PServer = (p2pPort: number) => {
    const server: Server = new WebSocket.Server({port: p2pPort});
    server.on('connection', (ws: WebSocket) => {
        initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2pPort);
};

// New connection
const initConnection = (ws : WebSocket) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    // Request Chain length
    write(ws, queryChainLengthMsg());
};

const JSONToObject = <T>(data: string): T => {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.log(e);
        return null;
    }
};

// Recieve message and interpret result
const initMessageHandler = (ws : WebSocket) => {
    ws.on('message', (data: string) => {
        const message: Message = JSONToObject<Message>(data);
    
        if (message === null) {
            console.log("Could not parse recieved JSON Message:" + data);
            return;
        }
        console.log("Recieved message" + JSON.stringify(message));

        // Respond to message
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                // We have recieved blocks from another node
                const recievedBlocks: Block[] = JSONToObject<Block[]>(message.data);
                if (recievedBlocks === null) {
                    console.log("Invalid blocks recieved: ");
                    console.log(message.data);
                    break;
                }
                handleBlockchainResponse(recievedBlocks);
                break;
        }

    });
};

const write = (ws: WebSocket, message: Message):void => ws.send(JSON.stringify(message));
const broadcast = (message: Message): void => sockets.forEach((socket) => write(socket, message)); 

// Message: Query latest block
const queryChainLengthMsg = (): Message => ({'type': MessageType.QUERY_LATEST, 'data': null}); 

// Message: Query entire blockchain
const queryAllMsg = (): Message => ({'type': MessageType.QUERY_ALL, 'data': null});

// Message: Return latest block 
const responseLatestMsg = (): Message => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify([getLatestBlock()])
}); 

// Message: Return entire blockchain
const responseChainMsg = (): Message => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(getBlockchain())
});

// Close connection on error
const initErrorHandler = (ws: WebSocket) => {
    const closeConnection = (myWs: WebSocket) => {
        console.log('connection failed to peer: ' + myWs.url);
        sockets.splice(sockets.indexOf(myWs), 1);
    }

    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

const handleBlockchainResponse = (receivedBlocks: Block[]) => {
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    const latestBlockReceived: Block = receivedBlocks[receivedBlocks.length - 1];
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }
    const latestBlockHeld: Block = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: '
            + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            if (addBlockToChain(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        } else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        } else {
            console.log('Received blockchain is longer than current blockchain');
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

const broadcastLatest = () => {
    broadcast(responseLatestMsg());
}

const connectToPeers = (newPeer : string) => {
    const ws : WebSocket = new WebSocket(newPeer);
    ws.on('open', () => {initConnection(ws);});
    ws.on('error', () => {console.log("connection failed");});
}

export {connectToPeers, broadcastLatest, initP2PServer, getSockets};