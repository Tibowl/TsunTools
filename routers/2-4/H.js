exports.map = "2-4";
exports.node = "H";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);


    let type = "other";
    
    if (sc.aCA <= 1 && s.CL >= 1 && s.DD >=4) return "<= 1 CA(V), >= 1 CL, >= 4 DD"

    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)
	//if(edge == "N") console.log(/*entry, */getUnorderedFleetComp(s) + " -> " + edge) 
	
    return type; 
}