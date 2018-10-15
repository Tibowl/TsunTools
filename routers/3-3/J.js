exports.map = "3-3";
exports.node = "J";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'M': '\x1b[41m\x1b[37m', // Red BG
    'K': '\x1b[41m\x1b[30m', //Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //Wikia routing conditions
    if (s.CL <= 1 && s.DD + s.CL >= 5) type = "CL <=1 & CL + DD >= 5 (M)";
    else type = "other (K) ";


    //Lambda routing all fine as well


    return type;
}