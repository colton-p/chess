import { State } from '../main';

function perftSuite(name, fen, results) {
    describe(name, () => {
        results.forEach( ([exp, expDetails], depth) => {
            test(`perft(${depth}) = ${exp}`, () => {
                const [act, actDetails] = State.fromFen(fen).perft(depth);
                expect(act).toBe(exp);
                Object.keys(expDetails).forEach(k => {
                    expect(actDetails[k]).toBe(expDetails[k]);
                })
            });
        });
    });
}

describe ("perft", () => {
    perftSuite('start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
        [1, {}],
        [20, {}],
        [400, {}],
        [8902, { captures: 34 }],
        [197281, { captures: 1576 }],
    ]);

    perftSuite('position 4', 'r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1', 
    [
        [1, {}],
        [6, {}],
        [264, {captures:87, castles:6, promotions:48, checks: 10}],
        [9467, {captures:1021,ep:4, promotions:120, checks: 38, checkmates: 22}],
    ]);

    perftSuite('position 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    [
        [1, {}],
        [44, {}],
        [1486, {}],
        [62379, {}],
    ]);
});