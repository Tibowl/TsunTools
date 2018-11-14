exports.map = "5-2";
exports.node = "F";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";
    if(entry.hqlvl == 120) {
        if(getLoS(entry, 2) > 70) return "enough LoS (>70 Cn2)";
        if(getLoS(entry, 2) < 64) return "not enough LoS (<64 Cn2)";
    } else {
        if(getLoS(entry, 2) > 70) return "enough LoS (>71 Cn2) (HQ <120)";
        if(getLoS(entry, 2) < 64) return "not enough LoS (<63 Cn2) (HQ <120)";
    }

    return "HQ: " + entry.hqlvl + "  LoS: " + Math.floor(getLoS(entry, 2)*10)/10

    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	
    return type; 
}