function f(x, y) {
  return 1 + y;
}
f();

const handler = {
  get: function(target, name) {
    return target.hasOwnProperty(name) ? target[name] : 0;
  }
};

let STATS = new Proxy({}, handler);


const PAWN = 0x01;
const BISHOP = 0x02;
const KNIGHT = 0x04;
const ROOK = 0x08;
const QUEEN = 0x10;
const KING = 0x20;

const WHITE = 0x40;
const BLACK = 0x80;

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
REV_FEN_TABLE[WHITE | PAWN] = 'P';


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
    // TODO
    let c = {
    };
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

    const file = this.epTargetStr[0].charCodeAt() - 97;
    const rank = parseInt(this.epTargetStr[1], 10) - 1;

    return rank * 16 + file;
  }

  halfMoves() {
    return parseInt(this.halfMovesStr, 10);
  }
  fullMoves() {
    return parseInt(this.fullMovesStr, 10);
  }
}

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

    return eeToAlgebraic(this.boardObj.epTarget);
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

function eeToAlgebraic(ee) {
    const file = ee & 7;
    const rank = ee >> 4;
    return `${String.fromCharCode(file + 97)}${rank+1}`
}

function algebraicToEe(alg) {
    const file = alg[0].charCodeAt() - 97;
    const rank = parseInt(alg[1], 10) - 1;

    return rank * 16 + file;
}

  const DIRS = {
    N: 0x10,
    S: -0x10,
    W: -1,
    E: 1,
    NE: 0x11,
    NW: 0x0F,
    SW: -0x11,
    SE: -0x0F,
  }

  const DIR_TO_PIECE = {
    N: [QUEEN, ROOK],
    S: [QUEEN, ROOK],
    W: [QUEEN, ROOK],
    E: [QUEEN, ROOK],
    NE: [QUEEN, BISHOP],
    NW: [QUEEN, BISHOP],
    SW: [QUEEN, BISHOP],
    SE: [QUEEN, BISHOP],
  }

class State {


  static fromStart() {
    const s = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    return State.fromFen(s);
  }

  static fromFen(fenString) {
    const parser = new FenParser(fenString);

    return new State({
      board: parser.board(),
      castling: parser.castling(),
      active: parser.active(),
      epTarget: parser.epTarget(),
      halfMoves: parser.halfMoves(),
      fullMoves: parser.fullMoves(),
    });
  }

  constructor({board, castling, active, epTarget, halfMoves, fullMoves}) {
    this.board = board;
    this.castling = castling;
    this.active = active;
    this.epTarget = epTarget;
    this.halfMoves = halfMoves;
    this.fullMoves = fullMoves;

    this.pieces = [];
    board.forEach((piece, ix) => {
      if (piece) { this.pieces.push( [piece, ix] ); }
    });
  }
  toFen(){
    const s = new FenSerializer(this)
    return s.toFen();
  }


  moves() {
    if (!this.__moves) {
      STATS.moves += 1;
      const m = this.pieces.map( ([p, ix]) => this.movesFromSquare(ix) )

      this.__moves = [].concat(...m).filter(x => this.makeMove(x)).sort((x,y) => (y.capture ? 1 : 0) - (x.capture?1:0));
    }
    return this.__moves;
  }

  perftSplit() {
    let o = {}
    let c = 0;
    this.pieces.forEach( ([p, ix]) => {
      const mm = this.movesFromSquare(ix).filter(x => this.makeMove(x));
      if (mm.length) {
        o[eeToAlgebraic(ix)] = mm.length;
      }
      c += mm.length;
    });

    o['total'] = c;

    return o;
  }

  movesFromSquare(eeIx) {
    const slidingMoves = (dirs) =>  {

      let ret = []
      dirs.forEach(dir => {
        let tgt = eeIx;

        while (!(tgt & 0x88)) {
          tgt += dir;
          if (this.board[tgt] & this.active) { break; }
          else if (this.board[tgt]) { 
            ret.push({ src: eeIx, dst: tgt, capture: true });
            break;
          } else {
            ret.push({ src: eeIx, dst: tgt });
          }
        }
      });
      return ret;
    }

    const piece = this.board[eeIx];
    const V = this.active === WHITE ? 1 : -1;
    if (!piece) { return []; }
    if (!(piece & this.active)) { return []; }

    let moveTgts = [];
    if (piece & PAWN) {
      let pawnTgts = [];
      let tgt = eeIx + V * DIRS.N;
      if (!this.board[tgt]) {
        pawnTgts.push({ src: eeIx, dst: tgt });
      }

      if ((this.active === WHITE && (eeIx >> 4) === 1) || (this.active === BLACK && (eeIx >> 4) == 6)) {
        const s1 = eeIx + 1 * V * DIRS.N;
        const s2 = eeIx + 2 * V * DIRS.N;
        if (!this.board[s1] && !this.board[s2]) {
          moveTgts.push({ src: eeIx, dst: s2, ep: s1 });
        }
      }
      tgt = eeIx + V * DIRS.NE;
      if (this.board[tgt] && !(this.board[tgt] & this.active)) {
        pawnTgts.push({ src: eeIx, dst: tgt, capture: 1 });
      }
      tgt = eeIx + V * DIRS.NW;
      if (this.board[tgt] && !(this.board[tgt] & this.active)) {
        pawnTgts.push({ src: eeIx, dst: tgt, capture: 1 });
      }

      if(this.epTarget === eeIx + V*DIRS.NE || this.epTarget === eeIx + V*DIRS.NW) {
        moveTgts.push({ src: eeIx, dst: this.epTarget, capture: 1, epCapture: this.epTarget - V * DIRS.N });
      } 

      const promotionRank = this.active === WHITE ? 7 : 0;
      pawnTgts.forEach(m => {
        if((m.dst >> 4) === promotionRank) {
          moveTgts.push({promotion: this.active | QUEEN, ...m});
          moveTgts.push({promotion: this.active | KNIGHT, ...m});
          moveTgts.push({promotion: this.active | BISHOP, ...m});
          moveTgts.push({promotion: this.active | ROOK, ...m});
        } else {
          moveTgts.push(m);
        }
      });

    } else if (piece & KING) {
      moveTgts = Object.values(DIRS).map(d => {
        const o = { src: eeIx, dst: eeIx + d };
        if (this.board[eeIx + d] && !(this.board[eeIx + d] & this.active)) {
          o.capture = true;
        }
        return o
      });

      // castling
      if (this.castling[this.active]) {
        const V = this.active === WHITE ? 0 : 0x70;
        const kingsideSquares = [V|0x05, V|0x06];
        const queensideSquares = [V|0x01, V|0x02, V|0x03];
        if(
          (this.castling[this.active].king) &&
          (this.board[V|0x07] === (this.active|ROOK)) &&
          (kingsideSquares.every( s => !this.board[s] )) && 
          (!this.isCheck(this.active)) && 
          (kingsideSquares.every( s => !this.isSquareAttacked(s, this.active) ))
        ) {
          moveTgts.push({src: eeIx, dst: V|0x06, castle: {
            desc: 'king', src: V|0x07, dst: V|0x05,
          }});
        }
        if(
          (this.castling[this.active].queen) &&
          (this.board[V|0x00] === (this.active|ROOK)) &&
          (queensideSquares.every( s => !this.board[s] )) && 
          (!this.isCheck(this.active)) &&
          ([V|0x02, V|0x03].every( s => !this.isSquareAttacked(s, this.active) ))
        ) {
          moveTgts.push({src: eeIx, dst: V|0x02, castle: {
            desc: 'queen', src: V|0x00, dst: V|0x03,
          }});
        }
      }



    } else if (piece & KNIGHT) {
      const knightMoves = [0x21, 0x1F, -0x21, -0x1F, 0x12, -0x12, 0x0e, -0x0e];
      moveTgts = knightMoves.map(d => {
        return { src: eeIx, dst: eeIx + d, capture: this.board[eeIx + d] && !(this.board[eeIx + d] & this.active)}
      });
    } else if (piece & ROOK) {
      const dirs = [DIRS.N, DIRS.S, DIRS.E, DIRS.W];
      moveTgts = slidingMoves(dirs);
    } else if (piece & BISHOP) {
      const dirs = [DIRS.NE, DIRS.SE, DIRS.NW, DIRS.SW];
      moveTgts = slidingMoves(dirs);
    } else if (piece & QUEEN) {
      const dirs = Object.values(DIRS);
      moveTgts = slidingMoves(dirs);
    }

    moveTgts = moveTgts.filter(({dst}) => ( (dst & 0x88) === 0) && !(this.board[dst] & this.active) );

    return moveTgts //moveTgts.map(t => `${eeToAlgebraic(eeIx)}${t}`);
  }

  makeMoveFromAlg(srcAlg, dstAlg) {
    const src = algebraicToEe(srcAlg);
    const dst = algebraicToEe(dstAlg);

    let possibleMoves = this.movesFromSquare(src);
    possibleMoves = possibleMoves.filter( m => m.src === src && m.dst === dst );

    if (possibleMoves.length === 0) { return null; }

    //if (possibleMoves.length > 1) { //throw new Error('????', possibleMoves); }

    return this.makeMove(possibleMoves[0]);
  }

  makeMove(moveObj) {
    // must be pseudo-legal
    const {src, dst, ep, capture, epCapture, castle, promotion} = moveObj;

    const newBoard = this.board.slice();
    newBoard[dst] = newBoard[src];
    delete newBoard[src];
    if (epCapture) {
      delete newBoard[epCapture];
    }
    if(promotion) {
      newBoard[dst] = promotion;
    }


    const newCastle = {};
    newCastle[WHITE] = Object.assign({}, this.castling[WHITE]);
    newCastle[BLACK] = Object.assign({}, this.castling[BLACK]);
    if (castle) {
      newBoard[castle.dst] = newBoard[castle.src];
      delete newBoard[castle.src];
      newCastle[this.active][castle.desc] = undefined;
    }
    if (this.board[src] & KING) { newCastle[this.active] = {}; }
    if (this.board[src] & ROOK) {
      const V = this.active === WHITE ? 0 : 0x70;
      if (src === (V|0x00)) { delete newCastle[this.active].queen; }
      if (src === (V|0x07)) { delete newCastle[this.active].king; }
    }

    const newState = new State({
      board: newBoard,
      castling: newCastle,
      active: this.active === WHITE ? BLACK : WHITE,
      epTarget: ep,
      halfMoves: this.halfMoves + 1,
      fullMoves: this.fullMoves + 1,
    });

    if (newState.isCheck(this.active)) { return null; }

    return newState;
  }

  isCheck(color = this.active) {
    const [x, king] = this.pieces.find( ([v, ix]) => v === (KING | color));

    return this.isSquareAttacked(king, color);
  }

  isSquareAttacked(square, color) {
    // pawn
    const V = color === WHITE ? 1 : -1;
    const pawnMoves = [V*DIRS.NW, V*DIRS.NE];
    const rp = pawnMoves.find(d => {
      const attackIx = square + d;
      if (attackIx & 0x88) { return false; } // invalid square
      const attack = this.board[attackIx];
      if (!attack) { return false; } // empty square
      if (attack & color) { return false; } // my piece
      return (attack & PAWN);
    });

    if (rp) { return true; }

    // king
    const kingMoves = Object.values(DIRS);
    const rk = kingMoves.find(d => {
      const attackIx = square + d;
      if (attackIx & 0x88) { return false; } // invalid square
      const attack = this.board[attackIx];
      if (!attack) { return false; } // empty square
      if (attack & color) { return false; } // my piece
      return (attack & KING);
    });
    if (rk) { return true; }

    // knight
    const knightMoves = [0x21, 0x1F, -0x21, -0x1F, 0x12, -0x12, 0x0e, -0x0e];
    const rn = knightMoves.find(d => {
      const attackIx = square + d;
      if (attackIx & 0x88) { return false; }
      const attack = this.board[attackIx];
      if (!attack) { return false; }
      if (attack & color) { return false; }
      return (attack & KNIGHT);
    });
    if (rn) { return true; }

    // sliding
    const dirs = Object.entries(DIRS);
    const r1 = dirs.find(([dirName, dir]) => {
        let tgt = square;

        while (!(tgt & 0x88)) {
          tgt += dir;
          const sq = this.board[tgt]
          if (!sq) { continue; } // empty
          if (sq & color) { break; } // my piece

          return DIR_TO_PIECE[dirName].find(x => sq & x);
        }
        return false;
      });

    return r1;

  }

  isStalemate() { return !this.isCheck() && this.moves().length === 0 }
  isCheckmate() { return this.isCheck() && this.moves().length === 0 }

  evaluate() {
    let s = 0;
    const T = {1: 1, 2: 3, 4: 3, 8: 5, 16: 9, 32: 100};
    if (this.isCheckmate()) { return ((this.active === WHITE) ? -1 : 1)*99; }

    this.pieces.forEach(([piece, ix]) => {
      const V = (WHITE & piece) ? 1 : -1;
      s += V*(T[(piece&0x3F)] || 0);
    });
    return s;
  }

  bestMove(depth=4) {
    CCC = 0;
    let {value, best} = abSearch(this, depth, -999, 999, this.active === WHITE, []);
    console.log('nodes:', CCC);
    let m = best[0];
    console.log(value, eeToAlgebraic(m.src), eeToAlgebraic(m.dst), m);

    return m, best;
  }

};

var CCC = 0;

function abSearch(node, depth, alpha, beta, isMax, pv) {
  CCC += 1;
  if (depth === 0 || node.moves().length === 0) { 
    const ee = node.evaluate();
    return {value: ee, best: pv };
  }

  if (isMax) {
    const moves = node.moves();
    let value = -9999;
    let best = null;
    for (let ix = 0; ix < moves.length; ++ix) {
      const move = moves[ix];
      const child = node.makeMove(move);
      const rslt = abSearch(child, depth-1, alpha, beta, false, [...pv, move]);
      if (rslt.value > value) {
        value = rslt.value;
        best = rslt.best;
      }

      alpha = Math.max(alpha, value);
      if (alpha >= beta) { break; }
    }
    return { value, best };
  } else {
    const moves = node.moves();
    let value = 9999;
    let best = null;
    for (let ix = 0; ix < moves.length; ++ix) {
      const move = moves[ix];
      const child = node.makeMove(move);
      const rslt = abSearch(child, depth-1, alpha, beta, true, [...pv, move]);
      if (rslt.value < value) {
        value = rslt.value;
        best = rslt.best;
      }

      beta = Math.min(beta, value);
      if (beta <= alpha) { break; }
    }
    return {value, best, alpha, beta};
  }
}

let v = State.fromStart();
//v = State.fromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 1 1');
//v = State.fromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -  1 1');
//v = State.fromFen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');  
//v = State.fromFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');

/*
function perft(init, maxDepth) {
  let C = {captures: 0, ep: 0, checks: 0, checkmates: 0, castles: 0, promotions: 0}
  function fff(v, lastMove, maxDepth=1, depth=0) {
    if (depth == maxDepth) { 
      if (v.isCheckmate()) { C.checkmates += 1; } 
      if (v.isCheck()) { C.checks += 1; } 
      if (lastMove.capture) { C.captures += 1; }
      if (lastMove.epCapture) { C.ep += 1; }
      if (lastMove.castle) { C.castles += 1; }
      if (lastMove.promotion) { C.promotions += 1; }
      return 1; }

    const moves = v.moves();
    let t = 0;
    moves.forEach( m => {
      const child = v.makeMove(m);

      var x = fff(child, m, maxDepth, depth+1);
      // if (depth === 0) { console.log(eeToAlgebraic(m.src), eeToAlgebraic(m.dst), x); }
      t += x;
    });
    return t;
  }
  return [fff(v, {}, maxDepth, 0), C];
}

console.log(v);
for(let d = 0; d <= 0; ++d) {
  const [t, c] = perft(v, d);
  console.log(d, t, c);
}
//console.log(v.moves())
{
let [val,pv] = abSearch(v, 1, -999, 999, true, []);
console.log(val);
console.log(pv);
pv.forEach(m => {
  console.log(eeToAlgebraic(m.src), eeToAlgebraic(m.dst), m.capture);
});
}*/