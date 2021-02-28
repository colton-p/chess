const { expect } = require('@jest/globals');
const Moves = require('../moves');


const moveCases = [
    [ {src: 0, dst: 32 }, 'a1a3'],
    [ {src: 0, dst: 4 }, 'a1e1'],
    [ {src: 34, dst: 1 }, 'c3b1'],
    [ {src: 16, dst: 1, promotion: 0x82 }, 'a2b1b'],
    [ {src: 16, dst: 1, promotion: 0x84 }, 'a2b1n'],
    [ {src: 16, dst: 1, promotion: 0x88 }, 'a2b1r'],
    [ {src: 16, dst: 1, promotion: 0x90 }, 'a2b1q'],

    [ {src: 96, dst: 112, promotion: 0x42 }, 'a7a8b'],
    [ {src: 96, dst: 112, promotion: 0x44 }, 'a7a8n'],
    [ {src: 96, dst: 112, promotion: 0x48 }, 'a7a8r'],
    [ {src: 96, dst: 112, promotion: 0x50 }, 'a7a8q'],
];

describe('toAlg', () => {
    moveCases.forEach( ([m, exp]) => {
        test(`${JSON.stringify(m)} --> ${exp}`, () => { 
            const act = Moves.toAlg(m);
            expect(act).toBe(exp);
        });
    });
});

describe('fromAlg', () => {
    moveCases.forEach( ([exp, alg]) => {
        test(`${alg} --> ${JSON.stringify(exp)}`, () => { 
            const act = Moves.fromAlg(alg);
            expect(act).toStrictEqual(exp);
        });
    });
});

/*
describe('moves')
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

    const bestLine = g.bestMove(3);

    // Qd5+
    expect(bestLine[0].src).toBe(65);
    expect(bestLine[0].dst).toBe(67);

    // cxb8=N#
    expect(bestLine[2].src).toBe(98);
    expect(bestLine[2].dst).toBe(113);
    expect(bestLine[2].promotion).toBe(68);
    expect(bestLine[2].capture).toBe(1);
});





function perftSuite(name, fen, results) {
        results.forEach( ([exp, expDetails], depth) => {
            test(`${name}: perft(${depth}) = ${exp}`, () => {
                const [act, actDetails] = State.fromFen(fen).perft(depth);
                expect(act).toBe(exp);
                Object.keys(expDetails).forEach(k => {
                    expect(actDetails[k]).toBe(expDetails[k]);
                })
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
]);*/