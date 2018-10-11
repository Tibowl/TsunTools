exports.map = "3-2";
exports.node = "G";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";
	
	if(s.CV + s.CVB) return "contains CV(B)"
	if(sc.aBB + s.CVL >= 2) return "2 BB+CVL"
	if(entry.fleetspeed == 5) return "Slow"

    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(type == "other") type = getUnorderedFleetComp(s)

    return type;
}