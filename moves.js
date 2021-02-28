function toAlg(m){
    const promo = {
      0x10: 'q',
      0x04: 'n',
      0x02: 'b',
      0x08: 'r',
    };
    return `${eeToAlgebraic(m.src)}${eeToAlgebraic(m.dst)}${promo[m.promotion & 0x3F] || ''}`;
}

function fromAlg(alg) {
    const srcAlg = alg.slice(0, 2);
    const dstAlg = alg.slice(2, 4);
    const src = algebraicToEe(srcAlg);
    const dst = algebraicToEe(dstAlg);

    const promoAlg = alg[4];
    if (promoAlg) {
        const V = (dst >> 4) === 0 ? 0x80 : 0x40;
        const map = {
            'q': 0x10,
            'n': 0x04,
            'b': 0x02,
            'r': 0x08,
        };
        const promotion = (map[promoAlg] | V);

        return { src, dst, promotion };
    }

    return { src, dst }

}

function eeToAlgebraic(ee) {
    const file = ee & 7;
    const rank = ee >> 4;
    return `${String.fromCharCode(file + 97)}${rank+1}`
}

function algebraicToEe(alg) {
    const file = alg[0].charCodeAt() - 97;
    const rank = parseInt(alg[1], 10) - 1;

    return rank * 16 + file;
}


module.exports = {
    toAlg,
    fromAlg,
    eeToAlgebraic, 
    algebraicToEe,
};