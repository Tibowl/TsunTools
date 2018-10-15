exports.map = "3-3";
exports.node = "A";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'C': '\x1b[45m\x1b[37m', // Purple BG
    'B': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    

    //Lambda's conditions
    if (s.CV > 0 || s.CVB > 0) type = "Includes CV(B) (C) ";
    else if (sc.aBB + sc.aCV >= 4) type = "BB + CV >= 4 (C) ";
    else if (sc.aBB + sc.aCV == 1 && s.CL == 1 && s.DD == 4) type = "BB + CV 1, CL 1, DD 4 (C)";
    else type = "other (B) ";


    

    return type;
}
