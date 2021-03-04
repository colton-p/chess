
import { State } from './main.js';

import { performance } from 'perf_hooks';


for(let d = 1 ; d <= 8; ++d) {
    const v = State.fromStart();
    const t0 = performance.now();
    v.bestMove(d);
    const dt = Math.round(performance.now() - t0);
    console.log(`bestMove(${d}): ${dt} ms`);
}