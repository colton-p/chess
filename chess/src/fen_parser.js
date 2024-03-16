
import { PAWN, BISHOP, KNIGHT, ROOK, QUEEN, KING, WHITE, BLACK } from './constants.js'
import Moves from './moves.js';

const FEN_TABLE = {
  'r': BLACK | ROOK,
  'n': BLACK | KNIGHT,
  'b': BLACK | BISHOP,
  'q': BLACK | QUEEN,
  'k': BLACK | KING,
  'p': BLACK | PAWN,
  'R': WHITE | ROOK,
  'N': WHITE | KNIGHT,
  'B': WHITE | BISHOP,
  'Q': WHITE | QUEEN,
  'K': WHITE | KING,
  'P': WHITE | PAWN,
};
const REV_FEN_TABLE = {};
REV_FEN_TABLE[BLACK | ROOK] = 'r';
REV_FEN_TABLE[BLACK | KNIGHT] = 'n';
REV_FEN_TABLE[BLACK | BISHOP] = 'b';
REV_FEN_TABLE[BLACK | QUEEN] = 'q';
REV_FEN_TABLE[BLACK | KING] = 'k';
REV_FEN_TABLE[BLACK | PAWN] = 'p';
REV_FEN_TABLE[WHITE | ROOK] = 'R';
REV_FEN_TABLE[WHITE | KNIGHT] = 'N';
REV_FEN_TABLE[WHITE | BISHOP] = 'B';
REV_FEN_TABLE[WHITE | QUEEN] = 'Q';
REV_FEN_TABLE[WHITE | KING] = 'K';
REV_FEN_TABLE[WHITE | PAWN] = 'P'

class FenParser {
  constructor(fenString) {
    this.fenString = fenString;
    const [piecePlacement, active, castling, epTarget, halfMoves, fullMoves] = fenString.split(' ');

    this.piecePlacement = piecePlacement;
    this.activeStr = active;
    this.castlingStr = castling;
    this.epTargetStr = epTarget;
    this.halfMovesStr = halfMoves;
    this.fullMovesStr = fullMoves;
  }

  board() {
    const ranks = this.piecePlacement.split('/');

    const board = new Array(128);
    ranks.forEach((rankString, ix) => {
      let rank = 7 - ix;
      let file = 0;
      rankString.split('').forEach((c) => {
        if (FEN_TABLE[c]) {
          board[rank * 16 + file] = FEN_TABLE[c];
          file += 1;
        } else {
          file += parseInt(c, 10);
        }
      });
    });

    return board;
  }

  active() {
    return this.activeStr  == 'w' ? WHITE : BLACK;
  }


  castling() {
    let c = { };
    c[WHITE] = {};
    c[BLACK] = {};

    if (this.castlingStr.includes('K')) { c[WHITE].king = true; }
    if (this.castlingStr.includes('Q')) { c[WHITE].queen = true; }
    if (this.castlingStr.includes('k')) { c[BLACK].king = true; }
    if (this.castlingStr.includes('q')) { c[BLACK].queen = true; }

    return c;
  }

  epTarget() {
    if (this.epTargetStr === '-') { return null; }

    return Moves.algebraicToEe(this.epTargetStr);
  }

  halfMoves() {
    return parseInt(this.halfMovesStr, 10);
  }
  fullMoves() {
    return parseInt(this.fullMovesStr, 10);
  }
}
;



class FenSerializer {
  constructor(boardObj) {
    this.boardObj = boardObj;
  }

  piecePlacement() {
    let fen = '';

    for(let rank = 7; rank >=0; --rank) {
      let blank = 0;
      for (let file = 0; file <= 7; ++file) {
        const piece = this.boardObj.board[rank * 16 + file];
        if (piece) {
          if (blank) { fen += blank; blank = 0; }
          fen += REV_FEN_TABLE[piece];
        } else {
          blank += 1;
        }
      }
      if (blank) { fen += blank; }
      if (rank > 0) { fen += '/'; }
    }

    return fen;
  }

  active() {
    return this.boardObj.active === WHITE ? 'w' : 'b';
  }

  castling() {
    let s = ''

    if (this.boardObj.castling[WHITE].king) { s += 'K'; }
    if (this.boardObj.castling[WHITE].queen) { s += 'Q'; }
    if (this.boardObj.castling[BLACK].king) { s += 'k'; }
    if (this.boardObj.castling[BLACK].queen) { s += 'q'; }

    if (!s) { return '-'; }
    return s;
  }

  epTarget() {
    if (this.boardObj.epTarget == null) { return '-'; }

    return Moves.eeToAlgebraic(this.boardObj.epTarget);
  }

  halfMoves() {
    return this.boardObj.halfMoves;
  }

  fullMoves() {
    return this.boardObj.fullMoves;
  }

  toFen() {
    return `${this.piecePlacement()} ${this.active()} ${this.castling()} ${this.epTarget()} ${this.halfMoves()} ${this.fullMoves()}`
  }

}

export { FenParser, FenSerializer };