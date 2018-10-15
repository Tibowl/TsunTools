exports.map = "7-1";
exports.node = "B";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'C': '\x1b[41m\x1b[37m', // Red BG
    'A': '\x1b[45m\x1b[37m', //Purple BG
    
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    /* routing condition priority (WIP)
        1) More than 1 CV(B/L) or includes a (F)BB(V) -> A 
        2) Includes a SS(V) -> A
        3) CL(T) + DD/E >= 4  -> C
        4) Includes a CA -> A
        5) otherwise -> C
        
        */

    if (sc.aCV > 1 || sc.aBB > 0) type = "Includes more than 1 CV(B/L) or (F)BB(V) (A) ";
    else if (sc.aSS > 0) type = "Includes a SS(V) ";
    else if (sc.aCL + sc.aDD >= 4) type = "CL(T) + DD/E >= 4 (C)";
    else if (s.CA > 0) type = "Includes a CA (A) ";
    

    //if (type == "Includes more than 1 CV(B/L) or (F)BB(V) or CA (A)" && edge != "A") console.log(getOrderedFleetComp(entry) + " -> " + edge);
    //if (type == "other" && edge == "C") console.log(getOrderedFleetComp(entry) + " -> " + edge);
    //if (type == "CL(T) + DD/E >= 4 (C)" && edge != "C") console.log(getOrderedFleetComp(entry) + " -> " + edge);



    return type;
}