// Import
const { ApiPromise, WsProvider } = require(`@polkadot/api`);
const { createType } = require(`@polkadot/types`);

async function retrieveBlockInfo(blockInput = ``) { 
    const provider = new WsProvider(`wss://rpc.polkadot.io`);
    
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    let blockHeader, blockTime, blockAuthor, blockHeader2;

    if (blockInput === ``) {
        // Retrieve the chain & node information information via rpc calls
        const [chain, nodeName, nodeVersion, header, now, deriveHeader] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version(),
            api.rpc.chain.getHeader(),
            api.query.timestamp.now(),
            api.derive.chain.getHeader()
        ]);

        blockHeader = header;
        blockTime = now;
        blockAuthor = deriveHeader.author;
        
        console.log(`\nYou are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
        console.log(`\nHere is the latest block information...`);
    } else {
        try {
            let blockNumber = api.createType(`BlockNumber`, blockInput);
            let lastBlockNumber = (await api.rpc.chain.getHeader()).number;
            if (blockNumber.lte(lastBlockNumber.toBn())) {
                let blockHash = await api.rpc.chain.getBlockHash(blockNumber).catch();
                blockHeader = await api.rpc.chain.getHeader(blockHash);
                blockTime = await api.query.timestamp.now.at(blockHash);
                blockAuthor = (await api.derive.chain.getHeader(blockHash)).author;
            }
        } catch {}

        try {
            let blockHash2 = api.createType(`BlockHash`, blockInput);
            blockHeader2 = await api.rpc.chain.getHeader(blockHash2);
            if (typeof blockHeader2.number !== `undefined`) {
                blockTime2 = await api.query.timestamp.now.at(blockHash2);
                blockAuthor2 = (await api.derive.chain.getHeader(blockHash2)).author;
            }
        } catch {}

        if (typeof blockHeader === `undefined` && (typeof blockHeader2 === `undefined` || typeof blockHeader2.number === `undefined`)) {
            console.log(`\nNo blocks found. At the prompt, hit enter to quit.\n`);
            return;
        }
    }
    
    if (typeof blockHeader !== `undefined`) {
        console.log(`\nBlock Info`)
        console.log(`Number: #${blockHeader.number}`);
        console.log(`Hash: ${blockHeader.hash}`);
        console.log(`Time: ${new Date(blockTime.toNumber())}`);
        if (typeof blockAuthor !== `undefined`) console.log(`Author: ${blockAuthor}`);
        console.log(``);
    }

    if (typeof blockHeader2 !== `undefined` && typeof blockHeader2.number !== `undefined`) {
        console.log(`\nBlock Info`)
        console.log(`Number: #${blockHeader2.number}`);
        console.log(`Hash: ${blockHeader2.hash}`);
        console.log(`Time: ${new Date(blockTime2.toNumber())}`);
        if (typeof blockAuthor2 !== `undefined`) console.log(`Author: ${blockAuthor2}`);
        console.log(``);
    }
}

async function main() {
    const readline = require(`readline`).createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // https://stackoverflow.com/a/46488389
    var question = function(q) {
        return new Promise((res) => readline.question(q, answer => res(answer)))
    }

    let blockInput = ``;
    do {
        await retrieveBlockInfo(blockInput).catch(() => {
            console.log(`There was an error. Closing...`);
            readline.close();
            process.exit();
        });
        blockInput = await question(`Enter a block number or block hash for more information: `);
    } while (blockInput !== ``);

    readline.close();
    process.exit();
}

main();