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

describe('isSquareAttacked', () => {
    test ('ok', () => {
        const g = State.fromFen('n7/8/8/8/8/8/1p6/K6k b - - 0 1');

        //console.error(g.isSquareAttacked1(0, 64));
        expect(g.isSquareAttacked(0, 64)).toEqual(true);
    })
});

describe('makeMoveFromAlg', () => {
    test('e4', () => {
        const g = State.fromStart();
        const h = g.makeMoveFromAlg('e2e4');

        const exp = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 1 2';
        expect(h.toFen()).toEqual(exp)
    });
    test('promotion', () => {
        const init = '8/8/5k2/8/8/5K2/p7/8 b - - 0 1';
        const g = State.fromFen(init);
        const h = g.makeMoveFromAlg('a2a1q');

        const exp = '8/8/5k2/8/8/5K2/8/q7 w - - 1 2';
        expect(h.toFen()).toEqual(exp)
    });
    test('under-promotion', () => {
        const init = '8/8/5k2/8/8/5K2/p7/8 b - - 0 1';
        const g = State.fromFen(init);
        const h = g.makeMoveFromAlg('a2a1n');

        const exp = '8/8/5k2/8/8/5K2/8/n7 w - - 1 2';
        expect(h.toFen()).toEqual(exp)
    });



});


