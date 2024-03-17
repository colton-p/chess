const readline = require('readline');

const {State} = require('./main.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
const it = rl[Symbol.asyncIterator]();

async function read() {
    const line = await it.next();
    console.log('info', 'got', '"', line.value, '"');
    return line.value;
}

function uci() {
    console.log('id name aaa3');
    // options go here
    console.log('uciok');
}

let G;
async function main() {

    while (true) {
        let line = await read();

        if (line === 'uci') {
            uci();
        } else if (line === 'isready') {
            console.log('readyok')
        } else if (line === 'ucinewgame') {
            G = null;
        } else if (line === 'position startpos') {
            G = State.fromStart();
        } else if (line.startsWith('position')) {
            let ll = line.split(' ');
            let d = ll[ll.length-1];
            G = G.makeMoveFromAlg(d.slice(0,2), d.slice(2,4));
        } else if (line.startsWith('go')) {
            const [g, wtime, wt, btime, bt, movestogo, moves] = line.split(' ');
            const tStr = G.active === 0x40 ? wt : bt;
            const t = parseInt(tStr, 10);
            const avg = t / parseInt(moves, 10);

            let m = G.bestMove(3);
            G = G.makeMoveFromAlg(m.slice(0,2), m.slice(2,4));
            console.log('bestmove', m);
        } else if (line === 'quit') {
            break;
        }
    }

    let line = await read();
    if (line !== 'uci') { throw line; }

    console.log('id name aaa');
    // options go here
    console.log('uciok');

    line = await read();
    if (line !== 'isready') { throw line; }
    console.log('readyok');


    line = await read();
    if (line !== 'ucinewgame') { throw line; }
    line = await read();
    if (line !== 'position startpos') { throw line; }

    G = State.fromStart();

    //line = await read();
    //if (line !== 'isready') { throw line; }
    //console.log('readyok');

    for (let ix = 0; ix < 2000; ++ix) {
        line = await read();

        console.log('info', line)
        if (line.slice(0,8) === 'position'){
        }

        line = await read();
        if (line !== 'isready') { throw line; }
        console.log('readyok');


        line = await read();
        if (line.slice(0,2) !== 'go') { throw line; }

        let m = G.bestMove();
        console.log('info best', m);
        console.log('info', 'tomove', G.active)
        G = G.makeMoveFromAlg(m.slice(0,2), m.slice(2,4));
        console.log('bestmove', m);
    }


}

main()