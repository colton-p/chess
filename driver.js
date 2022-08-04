// const readline = require('readline');

import readline from 'readline';
import { State } from './main.js';
// const {State} = require('./main.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
const it = rl[Symbol.asyncIterator]();

async function read() {
    const line = await it.next();
    // console.log('info', 'got', '"', line.value, '"');
    return line.value;
}

function uci() {
    console.log('id name aaa');
    // options go here
    console.log('uciok');
}

let G;
async function main() {

    try {
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
            G = G.makeMoveFromAlg(d);
        } else if (line.startsWith('go')) {
            const [g, wtime, wt, btime, bt, movestogo, moves] = line.split(' ');
            const tStr = G.active === 0x40 ? wt : bt;
            const t = parseInt(tStr, 10);
            const avg = t / parseInt(moves, 10);

            let d;
            //if (avg < 5_000 || t < 30_000) {
            if (t < 5_000) {
                d = 4;
            } else {
                d = 8;
            }
            let m = G.bestMove(d);
            console.log('bestmove', m);
            G = G.makeMoveFromAlg(m);
        } else if (line === 'quit') {
            return;
        }
    }
} catch (e) {
    console.log('info ERROR')
    console.log('info ERROR ' + e)
}
}

main()