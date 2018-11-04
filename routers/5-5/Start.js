exports.map = "5-5";
exports.node = "Start";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'A': '\x1b[46m\x1b[30m', // Aqua BG
    'B': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";
	
	if(s.DD >= 4) type = ">= 4 DD (A)"
    else if(getShipWithItemCount(entry, 75) >= 4) type = ">= 4 drums (A)"
    else if(getShipWithItemCount(entry, 68)/*+others?*/ >= 4) type = ">= 4 DLC (A)" 
    else type = "other (B)"

    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	
    return type; 
}