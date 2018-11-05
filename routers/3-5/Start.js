exports.map = "3-5";
exports.node = "Start";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";
    if (sc.aSS >= 3) type = ">= 3 SS"
    else if (sc.aBB >= 2) type = ">= 2 BB"
    else if (sc.aBB + sc.aCA >= 3) type = ">= 3 BB+CA"
    else if (sc.aCV) type = "a 1 CV(L)"
    else if (s.CLT) type = "a CLT"
    else type = s.DD + " DDs"
    
    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(type == "other") type = getUnorderedFleetComp(s)

    return type;
}