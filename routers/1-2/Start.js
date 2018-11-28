exports.map = "1-2";
exports.node = "Start";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'A': '\x1b[42m\x1b[30m', // Green BG
    'B': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);


    let type = "other";
	
	//return s.CA + s.CAV + sc.aBB + sc.aCV

    //if(entry.fleet1.length != 6) return "6 ships"
    if (sc.aDD == 4 && entry.fleet1.length <= 5) return "-> 4 DD/DE <= 5 Ships"

    type = getUnorderedFleetComp(s)
    if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	
    return type; 
}