import { randomBytes } from 'crypto';

function createPrivateKey(templatePrivateKey: string, password: string) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(templatePrivateKey + password, 'utf8').digest('hex');
    return hash.substring(0, 64);
}

export class Wallet {

    private mnemonic?: string;
    private type: string = 'tron';
    private keepixTokens?: { coins: any, tokens: any };
    private rpc: any;

    constructor({
        password,
        mnemonic,
        privateKey,
        keepixTokens,
        rpc,
        privateKeyTemplate = '0x2050939757b6d498bb0407e001f0cb6db05c991b3c6f7d8e362f9d27c70128b9'
    }:{
        password?: string,
        mnemonic?: string,
        privateKey?: string,
        keepixTokens?: { coins: any, tokens: any }, // whitelisted coins & tokens
        rpc?: any,
        privateKeyTemplate?: string,
    }) {
        this.keepixTokens = keepixTokens;
        this.rpc = rpc;

        // from password
        if (password !== undefined) {
            return ;
        }
        // from mnemonic
        if (mnemonic !== undefined) {
            return ;
        }
        // from privateKey only
        if (privateKey !== undefined) {
            return ;
        }
        // this.mnemonic = entropyToMnemonic(randomBytes(32));
        // this.keypair = Keypair.generate();
    }

    // PUBLIC

    public getPrivateKey() {
    }

    public getMnemonic() {
        return this.mnemonic;
    }

    public getAddress() {
    }

    public async getProdiver() {
        
    }

    public async getCoinBalance(walletAddress?: string) {
    }

    public async getTokenBalance(tokenAddress: string, walletAddress?: string) {
    }

    public async estimateCostOfTx(tx: any) {
    }

    public async estimateCostSendCoinTo(receiverAddress: string, amount: number) {
    }

    public async estimateCostSendTokenTo(tokenAddress: string, receiverAddress: string, amount: number) {
    }

    public async sendCoinTo(receiverAddress: string, amount: number) {
        
    }

    public async sendTokenTo(tokenAddress: string, receiverAddress: string, amount: string) {
        
    }
}