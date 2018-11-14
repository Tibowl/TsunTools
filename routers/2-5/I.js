exports.map = "2-5";
exports.node = "I";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    if(getLoS(entry, 1) < 31 && edge == "O") console.log(JSON.stringify(entry))
    if(getLoS(entry, 1) < 30) return "LoS fail";
    if(getLoS(entry, 1) > 35) return "LoS succ";

    return "HQ: " + entry.hqlvl + "  LoS: " + Math.floor(getLoS(entry, 1) )/**10)/10*/

    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	
    return type; 
}