import { useEffect, useState, useRef } from 'react'
import './App.css'
import { eeToAlgebraic } from './moves.js';

import { Chessground } from "chessground";

import "./assets/chessground.base.css";
import "./assets/chessground.brown.css";
import "./assets/chessground.cburnett.css";

import { State } from './main.js';

function toDests(game) {
  const dests = new Map();
  const moves = game.moves();
  moves.forEach(({ src: o_src, dst: o_dst }) => {
    const src = eeToAlgebraic(o_src);
    const dst = eeToAlgebraic(o_dst);
    if (!dests.has(src)) {
      dests.set(src, [])
    }
    dests.get(src).push(dst);
  });
  return dests
}
function toColor(game) {
  return game.active === 0x40 ? 'white' : 'black';
}



function App() {
  const [game, setGame] = useState(State.fromStart());
  window.game = game;
  const [api, setApi] = useState(null);
  const [thinking, setThinking] = useState(false);
  const color = toColor(game);
  const ref = useRef(null);

  const afterMove = (src, dst, meta) => {
    let newGame = null;
    try {
      newGame = game.makeMoveFromAlg(src + dst)
    } catch (e) {
      newGame = game.makeMoveFromAlg(src + dst + 'q')
    }
    api.set({ movable: { color: 'none' } });
    setGame(newGame);
  }

  useEffect(() => {
    if (color !== 'black') { return; }
    if (thinking) { return; }

    setThinking(true);
    // delay to let board animation finish
    setTimeout(() => {
      const bestMove = game.bestMove();
      const newGame = game.makeMoveFromAlg(bestMove);
      api.move(bestMove.slice(0, 2), bestMove.slice(2, 4));
      setGame(newGame)
      setThinking(false);
    }, 250);
  }, [thinking, game]);

  const config = {
    fen: game.toFen(),
    turnColor: color,
    check: game.isCheck(),
    movable: {
      color: color,
      free: false,
      dests: toDests(game),
      events: { after: afterMove }
    },
    highlight: { check: true },
    draggable: { showGhost: true },
    animation: { enabled: true, duration: 200 },
  };

  useEffect(() => {
    if (ref && ref.current && !api) {
      const chessgroundApi = Chessground(ref.current, {
        ...config,
      });
      setApi(chessgroundApi);
    } else if (ref && ref.current && api) {
      api.set(config);
    }
  }, [ref]);

  useEffect(() => {
    api?.set(config);
  }, [api, config]);

  const statusMessage = () => {
    if (game.isCheckmate()) {
      return (color === 'white' ? 'black wins' : 'white wins');
    }
    if (game.isStalemate()) { return 'stalemate'; }
    if (game.isCheck()) { return 'check'; }
    return ''
  }

  const toMoveMessage = () => {
    if (game.isStalemate() || game.isCheckmate()) { return ''; }
    if (color === 'white') { return 'white to move'; }

    return `black${(thinking ? ' thinking...' : '')}`
  }

  return (
    <>

      <div>{toMoveMessage()}</div>
      <div>{statusMessage()}</div>
      <div style={{ height: '800px', width: '800px' }} id="qqq">
        <div ref={ref} style={{ height: '100%', width: '100%', display: 'table' }}></div>
      </div>
    </>
  )
}

export default App
