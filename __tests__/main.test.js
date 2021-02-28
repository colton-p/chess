const { State } = require('../main');


test('20 moves from initial', () => {
    const g = State.fromStart();
    const moves = g.moves()
    expect(moves.length).toBe(20);
})

test('20 moves for black from initial', () => {
    const g = State.fromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 1 1');
    const moves = g.moves()
    expect(moves.length).toBe(20);
});

test('mate in 2 via under-promotion', () => {
    const g = State.fromFen('1rb4r/pkPp3p/1b1P3n/1Q6/N3Pp2/8/P1P3PP/7K w - - 1 0');

    const best = g.bestMove(3);

    // Qd5+
    expect(best).toEqual('b5d5');

    // cxb8=N#
    //expect(best).toEqual('c7b8n');
    //expect(bestLine[2].src).toBe(98);
    //expect(bestLine[2].dst).toBe(113);
    //expect(bestLine[2].promotion).toBe(68);
    //expect(bestLine[2].capture).toBe(1);
});





function perftSuite(name, fen, results) {
    describe("name", () => {
        results.forEach( ([exp, expDetails], depth) => {
            test(`${name}: perft(${depth}) = ${exp}`, () => {
                const [act, actDetails] = State.fromFen(fen).perft(depth);
                expect(act).toBe(exp);
                Object.keys(expDetails).forEach(k => {
                    expect(actDetails[k]).toBe(expDetails[k]);
                })
            });
        });
    });
}

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