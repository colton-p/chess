
function movesFromSquare(eeIx) {
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