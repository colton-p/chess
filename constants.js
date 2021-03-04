

const PAWN = 0x01;
const BISHOP = 0x02;
const KNIGHT = 0x04;
const ROOK = 0x08;
const QUEEN = 0x10;
const KING = 0x20;

const WHITE = 0x40;
const BLACK = 0x80;

const DIRS = {
    N: 0x10,
    S: -0x10,
    W: -1,
    E: 1,
    NE: 0x11,
    NW: 0x0F,
    SW: -0x11,
    SE: -0x0F,
};

const COLORLESS_MASK = 0x3F;

export { PAWN, BISHOP, KNIGHT, ROOK, QUEEN, KING, WHITE, BLACK, DIRS, COLORLESS_MASK };