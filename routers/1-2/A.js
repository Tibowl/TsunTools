exports.map = "1-1";
exports.node = "A";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'C': '\x1b[42m\x1b[30m', // Green BG
    'B': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    type = entry.fleet1.length + " ship" + (entry.fleet1.length == 1?"":"s");
	
    return type; 
}