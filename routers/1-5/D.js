exports.map = "1-5";
exports.node = "D";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

	if(entry.fleet1.length <= 4) {
		if(s.AO) type = "contains AO (E)";
		else if(entry.fleet1.length == 1) type = "1 ship (E)";
		else if(entry.fleet1.length == s.DE) type = "DE only (E)";
		else type = "<= 4 ships (F)";
	} else if(sc.aSS) type = "contains SS(V) (F)";
	
    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
    //if(type == "contains AO (E)" && edge != 'E') type = getOrderedFleetComp(entry)
    return type; // Other: 65% E/ 35% F random
}