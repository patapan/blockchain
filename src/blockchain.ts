// My First Crypto
import * as CryptoJS from 'crypto-js';
import {broadcastLatest} from './p2p';

class Block {
    public index: number;
    public hash: string;
    public previousHash: string;
    public timestamp: number;
    public data: string;

    constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

// Hash Function
const calculateHash = (index: number, previousHash: string, timestamp: number, data: string): string =>
    CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

const calculateHashForBlock = (block: Block): string => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
}


// Setup the initial block (the only block without a previousHash)
const genesisBlock: Block = new Block(
    0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'my genesis block!!'
);

// Initialisation of blockchain
let blockchain: Block[] = [genesisBlock];

const getBlockchain = (): Block[] => blockchain;

const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

const generateNextBlock = (blockData: string) => {
    const previousBlock: Block = getLatestBlock();
    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = new Date().getTime() / 1000;
    const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    addBlock(newBlock);
    broadcastLatest();
    return newBlock;

}

const addBlock = (newBlock: Block) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
}

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
    if (!isValidBlockStructure(newBlock)) {
        console.log("Invalid Structure");
        return false;
    }

    if (previousBlock.index + 1 !== newBlock.index) {
        console.log("Invalid Index");
        return false;
    }

    else if (newBlock.previousHash != previousBlock.hash) {
        console.log("Invalid Previous Hash");
        return false;
    }

    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log("Invalid Hash");
        return false;
    }
    return true;
}

const isValidBlockStructure = (block: Block): boolean => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

const isValidChain = (blockchainToValidate : Block[]): boolean => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(genesisBlock)) {
        return false;
    }

    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }

    return true;
};

const addBlockToChain = (block: Block): boolean => {
    if (isValidNewBlock(block, getLatestBlock())) {
        blockchain.push(block);
        return true;
    }
    return false;
};

const replaceChain = (newBlocks: Block[]) => {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
        blockchain = newBlocks;
        broadcastLatest();
    } else {
        console.log("Recieved blockchain invalid");
    }
}

export {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};