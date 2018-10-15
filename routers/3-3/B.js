exports.map = "3-3";
exports.node = "B";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'F': '\x1b[45m\x1b[37m', // Purple BG
    'D': '\x1b[42m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    

    //Lambda's routing conditions
    if (sc.aSS > 0) type = "Includes SS(V) (random) ";
    else if (sc.aBB + sc.aCV <= 1) type = "(F)BB(V) + CV(B/L) <= 1 (F) ";
    else if (sc.aBB + sc.aCV <= 2 && sc.aDD >= 2) type = "BB + CV <= 2 and DD >= 2 (F) ";
    else type = "other (random) ";

    //Lambda's conditions all check out.    

    return type;
}