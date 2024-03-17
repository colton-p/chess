import { PAWN, BISHOP, KNIGHT, ROOK, QUEEN, KING, WHITE, BLACK } from './constants.js';
const PIECES = [
    BLACK | ROOK,
    BLACK | KNIGHT,
    BLACK | BISHOP,
    BLACK | QUEEN,
    BLACK | KING,
    BLACK | PAWN,
    WHITE | ROOK,
    WHITE | KNIGHT,
    WHITE | BISHOP,
    WHITE | QUEEN,
    WHITE | KING,
    WHITE | PAWN,
];
const W = Math.floor(Math.random() * 0xFFFFFFFF);
const B = Math.floor(Math.random() * 0xFFFFFFFF);

const Z = new Array(128);
for (var ix = 0; ix < 128; ++ix) {
    Z[ix] = {};
    for (var jx = 0; jx < PIECES.length; ++jx) {
        Z[ix][PIECES[jx]] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
}

function zhash(board, active) {
    let r = (active === WHITE) ? W : B;
    for (var ix = 0; ix < board.length; ++ix) {
        if (ix & 0x88) { continue; }
        if (board[ix]) {
            r ^= Z[ix][board[ix]];
        }
    }
    return r;
}

export default zhash;