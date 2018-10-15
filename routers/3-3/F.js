exports.map = "3-3";
exports.node = "F";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'H': '\x1b[42m\x1b[30m', // Green BG
    'G': '\x1b[41m\x1b[37m', // Red BG
    'J': '\x1b[46m\x1b[30m', //Cyan BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //Wikia routing conditions
    if (s.DD <= 1) type = "DD <= 1 (G) ";
    else if (s.CL > 0 && s.DD >= 2) type = "CL > 0 DD >= 2 (H) ";
    else type = "other (random H/J) ";

    //Wikia routing all correct

   
    

    return type;
}