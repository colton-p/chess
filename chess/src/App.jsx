import { useEffect, useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {eeToAlgebraic} from './moves.js';

import {Chessground} from "chessground";

import "./assets/chessground.base.css";
import "./assets/chessground.brown.css";
import "./assets/chessground.cburnett.css";

import {State} from './main.js';

function toDests(game) {
  const dests = new Map();
  const moves = game.moves();
  moves.forEach(({src: o_src, dst: o_dst}) => {
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
  return game.active === 0x40 ? 'white': 'black';
}



function App() {
  const [game, setGame] = useState(State.fromStart());
  window.game = game;

  const afterMove = (src, dst, meta) => {
    console.log('after move', src, dst);
    let newGame = game.makeMoveFromAlg(src + dst)
    console.log('new', newGame)
    // setGame(newGame);

    // api.set({movable: { color: 'none' }});

    const bestMove = newGame.bestMove();
    console.log('best', bestMove);
    newGame = newGame.makeMoveFromAlg(bestMove);
    console.log('new', newGame)

    api.move(bestMove.slice(0, 2), bestMove.slice(2, 4));
    api.set({movable: { color: 'white', dests: toDests(newGame) } });
    setGame(newGame)
  }



  const initialConfig = {
    turnColor: toColor(game),
    movable: {
      color: toColor(game),
      free: false,
      dests: toDests(game),
      events: { after: afterMove }
    },
    draggable: { showGhost: true }
  };

  const [api, setApi] = useState(null);
  window.api = api;
  const ref = useRef(null);

  useEffect(() => {
    if (ref && ref.current && !api) {
      const chessgroundApi = Chessground(ref.current, {
        // animation: { enabled: true, duration: 200 },
        ...initialConfig,
      });
      setApi(chessgroundApi);
    } else if (ref && ref.current && api) {
      api.set(initialConfig);
    }
  }, [ref]);

  useEffect(() => {
    api?.set(initialConfig);
  }, [api, initialConfig]);


  return (
    <>

      <div>{api && api.state.turnColor}</div>
      <div style={{ height: '800px', width: '800px'}} id="qqq">
        <div ref={ref} style={{ height: '100%', width: '100%', display: 'table' }}></div>
      </div>
    </>
  )
}

export default App
