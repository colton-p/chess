

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
      return 1;
    }

    const moves = v.moves();
    let t = 0;
    moves.forEach( move => {
      const child = v.makeMove(move);
      var x = fff(child, move, maxDepth, depth+1);
      t += x;
    });
    return t;
  }
  return [fff(init, {}, maxDepth, 0), C];
}

export default perft;