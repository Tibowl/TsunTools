exports.map = "3-5";
exports.node = "F";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    if (s.LHA) type = "a LHA"
    else if (sc.aCV) type = "a CV(B/L)"
    else if (sc.aBB) type = "a BB(B/F)"
    else if (s.CL <= 2 && sc.aCA == 0) type = "<= 2 CL & 0 CA"
    
    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(type == "other") type = getUnorderedFleetComp(s)

    return type;
}