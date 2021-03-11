
import { PAWN, BISHOP, KNIGHT, ROOK, QUEEN, KING, WHITE, BLACK, DIRS, COLORLESS_MASK } from './constants.js'
import { FenParser, FenSerializer } from './fen_parser.js';
import Moves from './moves.js';
import perft from './perft.js'

//import { performance } from 'perf_hooks';

const handler = {
  get: function(target, name) {
    return target.hasOwnProperty(name) ? target[name] : 0;
  }
};

let STATS = new Proxy({}, handler);

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

  moves2() {
    if (!this.__moves) {
      this.__moves = [];
      for (let ix = 0; ix < this.pieces.length; ++ix) {
        const [piece, src] = this.pieces[ix];
        if (!(piece & this.active)) { continue; }

        const sqMoves = this.movesFromSquare(src);
        for (let jx = 0; jx < sqMoves.length; ++jx) {
          if (this.makeMove(sqMoves[jx])) {
            this.__moves.push(sqMoves[jx]);
          }
        }
      }
    }
    return this.__moves;
  }

  moves() {
    if (!this.__moves) {
      const m = this.pieces.map( ([p, ix]) => this.movesFromSquare(ix) )

      this.__moves = [].concat(...m).filter(x => this.makeMove(x)).sort((x,y) => (y.capture ? 1 : 0) - (x.capture?1:0));
    }
    return this.__moves;
  }

  movesFromSquare(eeIx) {
    const slidingMoves = (dirs) =>  {

      let ret = []
      for (let dx = 0; dx < dirs.length; ++dx ) {
        const dir = dirs[dx];
      //dirs.forEach(dir => {
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
      };
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

    return moveTgts;
  }

  makeMoveFromAlg(alg) {
    const move = Moves.fromAlg(alg);

    let possibleMoves = this.movesFromSquare(move.src);
    possibleMoves = possibleMoves.filter( m => m.src === move.src && m.dst === move.dst && m.promotion == move.promotion);

    if (possibleMoves.length !== 1) { 
        const candidates = this.movesFromSquare(move.src);
        const msg = `ERROR: ${alg} has no moves (from ${JSON.stringify(candidates)})`;
        console.log('info', msg)
        throw new Error(msg);
    }

    return this.makeMove(possibleMoves[0]);
  }

  makeMove(moveObj) {
    // TODO: -> makeMoveInternal
    // must be pseudo-legal
    STATS.makeMove += 1;
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
    //STATS.attack += 1; 
    const t0 = performance.now();
    const self = this;
    function canAttack(attacker, src, dst) {
      const delta = dst - src;

      if (attacker & KNIGHT) {
        const knightMoves = [0x21, 0x1F, -0x21, -0x1F, 0x12, -0x12, 0x0e, -0x0e];
        return knightMoves.includes(delta);
      } else if (attacker & PAWN) {
        const V = color === WHITE ? -1 : 1;
        const pawnMoves = [V*DIRS.NW, V*DIRS.NE];
        return pawnMoves.includes(delta);
      } else if (attacker & KING) {
        return Object.values(DIRS).includes(delta);
      }

      function checkRay(step) {
        const V = (delta > 0) ? 1 : -1;
        for (let sq = src + V*step; sq != dst; sq += V*step) {
          if (self.board[sq]) { return false; }
        }
        return true;
      }

      if (((attacker & QUEEN) || (attacker & ROOK)) && (-7 <= delta && delta <= 7)) {
        // rank
        return checkRay(1);
      }

      if (((attacker & QUEEN) || (attacker & ROOK)) && delta % 16 === 0) {
        // file
        return checkRay(16);
      }

      if (((attacker & QUEEN) || (attacker & BISHOP)) && delta % 15 === 0) {
        // anti-diagonal
        return checkRay(15);
      }
      if (((attacker & QUEEN) || (attacker & BISHOP)) && delta % 17 === 0) {
        // diagonal
        return checkRay(17);
      }

    }

    for (let ix = 0; ix < this.pieces.length; ++ix) {
      const [attacker, src] = this.pieces[ix];

      if (attacker & color) { continue; }
     
      if (canAttack(attacker & COLORLESS_MASK, src, square)) {
      //STATS.attack_t += performance.now() - t0; 
        return true;
      }
    }
    //STATS.attack_t += performance.now() - t0; 
    return false;
  }

  isSquareAttacked1(square, color) {
    // TODO: test iterating over enemy pieces, checking for attackables
    // pawn
    function fffff () {
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

    STATS.attack += 1; 
    const t0 = performance.now();
    const ret = fffff.bind(this)();
    STATS.attack_t += performance.now() - t0;
    return ret;

  }

  isStalemate() { return !this.isCheck() && this.moves().length === 0 }
  isCheckmate() { return this.isCheck() && this.moves().length === 0 }

  evaluate() {
    let s = 0;
    const T = {1: 1, 2: 3, 4: 3, 8: 5, 16: 9, 32: 100};
    const K = (this.active === WHITE) ? 1 : -1;
    if (this.isCheckmate()) { return -K*99; }

    this.pieces.forEach(([piece, ix]) => {
      const V = (WHITE & piece) ? 1 : -1;
      s += V*(T[(piece&COLORLESS_MASK)] || 0);
    });

    let whitePawns = [0, 0, 0, 0, 0, 0, 0, 0];
    let blackPawns = [0, 0, 0, 0, 0, 0, 0, 0];
    this.pieces.forEach( ([p, ix]) => {
      if (!(p & PAWN)) { return; }
      const file = ix & 0x07;
      if (p & WHITE) { whitePawns[file] += 1; }
      else if (p & BLACK) { blackPawns[file] += 1; }
    });

    const whiteDouble = whitePawns.filter(v => (v >= 2)).length;
    const blackDouble = blackPawns.filter(v => (v >= 2)).length;

    const whiteIso = whitePawns.filter( (v, ix) => {
      return v && (ix > 0 && whitePawns[ix-1] == 0) && (ix < 7 && whitePawns[ix+1] == 0);
    }).length;
    const blackIso = blackPawns.filter( (v, ix) => {
      return v && (ix > 0 && blackPawns[ix-1] == 0) && (ix < 7 && blackPawns[ix+1] == 0);
    }).length;

    return s - 0.5*(whiteDouble - blackDouble) - 0.5 * (whiteIso - blackIso);
  }

  perft(depth=2) {
    return perft(this, depth);
  }

  bestMove(depth=5) {
    CCC = 0;
    let {value, best} = abSearch(depth, this, depth, -999, 999, this.active === WHITE, []);
    console.log('info nodes:', CCC);
    console.log('info value:', value);
    console.log(`info depth ${depth} nodes ${CCC} score cp ${100*value}`)
    let m = best[0];
    //console.log(value, eeToAlgebraic(m.src), eeToAlgebraic(m.dst), m);

    return Moves.toAlg(m);
    //return m, best;
  }

};

var CCC = 0;

function abSearch(maxD, node, depth, alpha, beta, isMax, pv) {
  CCC += 1;
  if (CCC % 10_000 === 0) {
    console.log(`info depth ${maxD - depth} nodes ${CCC}`)
  }
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
      const rslt = abSearch(maxD, child, depth-1, alpha, beta, false, [...pv, move]);
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
      const rslt = abSearch(maxD, child, depth-1, alpha, beta, true, [...pv, move]);
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

//let v = State.fromStart();
//console.log(v.bestMove(5));
//v = State.fromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 1 1');
//v = State.fromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -  1 1');
//v = State.fromFen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');  
//v = State.fromFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');


/*
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

export { State, STATS };