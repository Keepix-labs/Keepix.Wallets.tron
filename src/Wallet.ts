import TronWeb from 'tronweb';
import { randomBytes } from 'crypto';
import { entropyToMnemonic, mnemonicToEntropy, mnemonicToSeedSync } from 'bip39';

const HttpProvider = TronWeb.providers.HttpProvider;

function createPrivateKey(templatePrivateKey: string, password: string) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(templatePrivateKey + password, 'utf8').digest('hex');
    return hash.substring(0, 64);
}

export class Wallet {

    private node: { fullNode: TronWeb.providers.HttpProvider, solidityNode: TronWeb.providers.HttpProvider; };
    private tronWeb: TronWeb;
    private mnemonic?: string;
    private type: string = 'tron';
    private keepixTokens?: { coins: any, tokens: any };
    private rpc: any;
    private wallet: { mnemonic: string, privateKey: string, publicKey: string };

    constructor({
        password,
        mnemonic,
        privateKey,
        keepixTokens,
        rpc,
        privateKeyTemplate = '81FB6642853A08E97622A759DB4277DFB9F8C23610908A4C3E7907F2BFD41EC7'
    }:{
        password?: string,
        mnemonic?: string,
        privateKey?: string,
        keepixTokens?: { coins: any, tokens: any }, // whitelisted coins & tokens
        rpc?: any,
        privateKeyTemplate?: string,
    }) {
        this.node = {
            fullNode: new HttpProvider('https://api.trongrid.io'),
            solidityNode: new HttpProvider('https://api.trongrid.io')
        }
        this.tronWeb = new TronWeb(this.node.fullNode, this.node.solidityNode);
        this.keepixTokens = keepixTokens;
        this.rpc = rpc;
        this.wallet = { mnemonic: '', privateKey: '', publicKey: '' };

        // from password
        if (password !== undefined) {
            const newPrivateKeyTron = createPrivateKey(privateKeyTemplate, password);
            this.mnemonic = entropyToMnemonic(Buffer.from(newPrivateKeyTron, 'hex'));
            this.wallet = { 
                mnemonic: this.mnemonic,
                privateKey: newPrivateKeyTron,
                publicKey: this.tronWeb.address.fromPrivateKey(newPrivateKeyTron)
            }
            return ;
        }
        // from mnemonic
        if (mnemonic !== undefined) {
            const privateKey =  mnemonicToEntropy(mnemonic);
            this.wallet = {
                mnemonic: mnemonic,
                privateKey: privateKey,
                publicKey: this.tronWeb.address.fromPrivateKey(privateKey)
            }
            return ;
        }
        // from privateKey only
        if (privateKey !== undefined) {
            this.wallet = {
                mnemonic: '',
                privateKey: privateKey,
                publicKey: this.tronWeb.address.fromPrivateKey(privateKey)
            }
            return ;
        }
        const newPrivateKeyTron = createPrivateKey('', randomBytes(32).toString('hex'));
        this.mnemonic = entropyToMnemonic(Buffer.from(newPrivateKeyTron, 'hex'));
        this.wallet = { 
            mnemonic: this.mnemonic,
            privateKey: newPrivateKeyTron,
            publicKey: this.tronWeb.address.fromPrivateKey(newPrivateKeyTron)
        }
    }

    // PUBLIC

    public getPrivateKey() {
        return this.wallet.privateKey;
    }

    public getMnemonic() {
        return this.wallet.mnemonic;
    }

    public getAddress() {
        return this.wallet.publicKey;
    }

    public async getProdiver() {
        const defaultRPC = {
            fullNode: new HttpProvider('https://api.trongrid.io'),
            solidityNode: new HttpProvider('https://api.trongrid.io')
        }
        let overridedRpc: any = undefined;

        if (this.rpc !== undefined && typeof this.rpc === 'object') {
            overridedRpc = this.rpc;
        }

        const coins = this.keepixTokens?.coins;
        if (coins === undefined) {
            return defaultRPC;
        }
        const coinInformation = coins[this.type];
        if (coinInformation === undefined) {
            return defaultRPC;
        }
        if (coins[this.type].rpcs === undefined || !Array.isArray(coins[this.type].rpcs)) {
            return defaultRPC;
        }
        if (coins[this.type].rpcs.length === 0) {
            return defaultRPC;
        }
        let rpc = coins[this.type].rpcs[Math.floor(Math.random()*coins[this.type].rpcs.length)];

        if (overridedRpc !== undefined
            && overridedRpc.chainId !== undefined
            && overridedRpc.url !== undefined && overridedRpc.url !== '') {
            rpc = overridedRpc;
        }
        return rpc;
    }

    public async getCoinBalance(walletAddress?: string) {
        if (walletAddress === undefined) {
            walletAddress = this.getAddress();
        }
        const balance = await this.tronWeb.trx.getBalance(walletAddress);
        const balanceTRX = this.tronWeb.fromSun(balance);

        return balanceTRX;
    }

    public async getTokenBalance(tokenAddress: string, walletAddress?: string) {
        if (!walletAddress)
            walletAddress = this.wallet.publicKey;

        this.tronWeb.setAddress(walletAddress);

        const contract = await this.tronWeb.contract().at(tokenAddress);
        const decimals = await contract.decimals().call();
        const balance = await contract.balanceOf(walletAddress).call();
        const balanceNumber = Number(balance._hex) / 10**Number(decimals);

        return balanceNumber.toFixed(8);
    }

    public async estimateCostOfTx(tx: any) {
        try {
            const transaction = await this.tronWeb.transactionBuilder.createTransaction(
                tx.to,
                tx.amount,
                tx.from,
                tx.options?.permissionId || 0,
                tx.options?.feeLimit || 1_000_000,
                tx.options?.callValue || 0,
                tx.options?.tokenId || '',
            );
    
            const cost = await this.tronWeb.trx.estimateTransaction(transaction);
    
            return { success: true, description: `${cost}` };
        } catch (e) {
            return { success: false, description: `Getting estimation failed: ${e}` };
        }
    }

    public async estimateCostSendCoinTo(receiverAddress: string, amount: number) {
        try {
            const chain = await this.tronWeb.trx.getChainParameters();
            const walletBalance = await this.getCoinBalance();
            
            if (Number(walletBalance) < amount) {
                return { success: false, description: `insufficient funds` };
            }
            
            
            let transactionFeeValue;
            for (let i = 0; i < chain.length; i++) {
                if (chain[i].key === 'getTransactionFee') {
                    transactionFeeValue = chain[i].value;
                    break;
                }
            }
            return { success: true, description: `${transactionFeeValue}` };
        } catch (error) {
            return { success: false, description: `Getting estimation failed: ${error}` };
        }
    }

    public async estimateCostSendTokenTo(tokenAddress: string, receiverAddress: string, amount: number) {
        const tokenBalance = await this.getTokenBalance(tokenAddress);

        if (Number(tokenBalance) < Number(amount)) {
            return { success: false, description: 'insufficient funds' };
        }

        const energyCost = await this.tronWeb.transactionBuilder.estimateEnergy(
            tokenAddress,
            'transfer(address,uint256)',
            { userFeePercentage: 100 },
            { address: receiverAddress, amount: 0 },
            this.wallet.publicKey
        );

        const bandwidthCost = await this.tronWeb.trx.estimateBandwidth({
            to: tokenAddress,
            amount: 0,
        });

        const totalCost = energyCost + bandwidthCost;

        return totalCost;
    }

    public async sendCoinTo(receiverAddress: string, amount: number) {
        try {
            const amountInSun = amount * 1e6;
    
            const transaction = await this.tronWeb.transactionBuilder.sendTrx(
                receiverAddress,
                amountInSun,
                this.wallet.publicKey
            );
    
            const signedTransaction = await this.tronWeb.trx.sign(transaction, this.wallet.privateKey);
            const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);
    
            return { success: true, description: result.transaction.txID };
        } catch (error) {
            return { success: false, description: `Sending TRX failed: ${error}` };
        }
    }

    public async sendTokenTo(tokenAddress: string, receiverAddress: string, amount: string) {
        try {
            const transaction = await this.tronWeb.transactionBuilder.sendToken(
                receiverAddress,
                Number(amount),
                tokenAddress,
                this.wallet.publicKey,
                { shouldPollResponse: true}
            );
    
            return { success: true, description: transaction.description.txID };
        } catch (error) {
            return { success: false, description: `Sending token failed: ${error}` };
        }
    }
}