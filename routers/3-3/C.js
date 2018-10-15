exports.map = "3-3";
exports.node = "C";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'E': '\x1b[41m\x1b[37m', // Purple BG
    'G': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //Wikia routing conditions
    if (sc.aDD >= 2 && sc.aCVnoL <= 1) {
        if (s.CL > 0 && s.CL + s.DD >= 5) type = "DD + CL >= 5 and CV(B) <= 1 (G) ";
        else if (sc.aBB + sc.aCV == 2) type = "BB + CV = 2 (G) ";
    } else type = "other (E) ";

    //Wikia conditions all check out


    return type;
}