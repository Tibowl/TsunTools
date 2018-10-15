exports.map = "7-1";
exports.node = "D";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'C': '\x1b[41m\x1b[37m', // Red BG
    'E': '\x1b[42m\x1b[37m', //Green BG

};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    /* routing condition priority (WIP)
        1) 1 or more DD with 3 or more DEs -> E
        2) Includes a CA(V), AV or CLT -> C
        3) Includes a SS(V) -> C
        4) 4 or more DDs -> E
        5) DD + DE is 5 -> E
        */

    if (s.DD >= 1 && s.DE >= 3) type = "DD >= 1, DE >= 3 (E) ";
    else if (sc.aCA > 0 || s.AV > 0 || s.CLT > 0) type = "Has a CA(V), AV, or CLT (C) ";
    else if (sc.aSS > 0) type = "Includes a SS(V) (C) ";
    else if (s.DD >= 4) type = "DD >= 4 (E) ";
    else if (s.DD + s.DE == 5) type = "DD + DE = 5 (E) ";

    //if (type == "DD >= 4 (E) " && edge != "E") console.log(getOrderedFleetComp(entry) + " -> " + edge);
    //if (type == "Has a CA(V), AV, CT or CLT (C) " && edge != "C") console.log(getOrderedFleetComp(entry) + " -> " + edge);



    return type;
}