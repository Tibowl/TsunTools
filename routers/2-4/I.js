exports.map = "2-4";
exports.node = "I";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'K': '\x1b[46m\x1b[30m', // Aqua BG
    'E': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);


    let type = "other";
	
	//return s.CA + s.CAV + sc.aBB + sc.aCV

    if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(edge == "N") console.log(/*entry, */getUnorderedFleetComp(s) + " -> " + edge) 
	
    return type; 
}