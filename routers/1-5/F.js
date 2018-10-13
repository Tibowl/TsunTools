exports.map = "1-5";
exports.node = "F";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'G': '\x1b[46m\x1b[30m', //Cyan BG 
    'I': '\x1b[41m\x1b[37m', //Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //Lambdas conditions + CV(B) and CVL conditions
    if (sc.aBBnoV > 0) type = "Includes (F)BB (I) ";
    else if (sc.aSS > 0) type = "Includes an SS(V) (I) ";
    else if (sc.aCVnoL > 0) type = "Includes a CV(B) (I) ";
    else if (s.CL >= 3) type = "CL >= 3 (I) ";
    else if (s.CVL > 1) type = "CVL > 1 (I) ";
    else type = "other (G)"

   // if (type == "other (G)" && edge == "I") console.log(getOrderedFleetComp(entry) + " -> " + edge);

    return type;
    
}