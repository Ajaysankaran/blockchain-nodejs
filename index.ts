import * as crypto from 'crypto'

class Transaction {
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ) { }

    toString() {
        return JSON.stringify(this)
    }
}

// Container for multiple transactions
class Block {
    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) { }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

}

//Linked list of blocks
class Chain {

    // Singleton instance
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'genesis'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Proof of work
    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️  mining...')
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex')

            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: string) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce)
            this.chain.push(newBlock)
        }
    }

}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })
        this.privateKey = keyPair.privateKey;
        this.publicKey = keyPair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey).toString();
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }

}


// Examples
const john = new Wallet();
const bob = new Wallet();
const peter = new Wallet();

john.sendMoney(50, bob.publicKey);
bob.sendMoney(100, peter.publicKey);
peter.sendMoney(200, bob.publicKey);

console.log(Chain.instance)