exports.map = "7-1";
exports.node = "Start";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'B': '\x1b[41m\x1b[37m', // Red BG
    'D': '\x1b[41m\x1b[37m', //Red BG
    'F': '\x1b[41m\x1b[37m', //Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    if (sc.aSS > 0) type = "Includes SS(V) (random) ";
    else if (sc.aBB > 0 || sc.aCV > 0) type = "Includes (F)BB(V) or CV(B/L) (B) " ;
    else if (entry.fleet1.length == 6) type = "6 ships (B) " ;
    else if (s.AO > 0) type = "Includes AO (D) ";
    else if (entry.fleet1.length == 5) type = "5 ships (D) " ;
    else if (entry.fleet1.length <= 4) type = "Less than 4 ships (F) ";


   

    /* routing condition priority (WIP)
        1) Includes SS(V) 
        2) Has a (F)BB(V) or a CV(B/L)
        3) 6 ships
        4) Has an AO 
        5) 5 ships
        6) 4 or less ships
        
        */
    


    return type;
}