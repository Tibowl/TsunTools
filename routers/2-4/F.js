exports.map = "2-4";
exports.node = "F";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);


    let type = "other";
    
    if (s.CVL == 0 && s.DD <= 1) return "<= 1 DD"
	//return s.CA + s.CAV + sc.aBB + sc.aCV

    if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(edge == "N") console.log(/*entry, */getUnorderedFleetComp(s) + " -> " + edge) 
	
    return type; 
}