exports.map = "1-5";
exports.node = "D";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;

    let type = "other";

    if(s.AO) type = "contains AO (E)"
    else if(entry.fleet1.length == 1) type = "1 ship (E)"
    else if(entry.fleet1.length == s.DE && entry.fleet1.length <= 4) type = "DE only (E)";
    else if(entry.fleet1.length <= 4) type = "<= 4 ships (F)";

    // if(type == "<= 4 ships (F)" && edge == 'E') type = getOrderedFleetComp(entry)
    return type; // Other: E/F random
}