exports.map = "3-3";
exports.node = "G";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'M': '\x1b[41m\x1b[37m', // Red BG
    'I': '\x1b[46m\x1b[30m', //Cyan BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //Wikia routing conditions
    if (sc.aBB + sc.aCV <= 3 && sc.aSS == 0) type = "BB + CV <= 3 and no SS(V) (M) ";
    else type = "other (random) ";

    //Wikia routing all correct

    //Lambda's routing conditions opposite of wikia
    //Lambda routing all fine as well


    return type;
}