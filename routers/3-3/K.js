exports.map = "3-3";
exports.node = "K";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'M': '\x1b[41m\x1b[37m', // Red BG
    'L': '\x1b[46m\x1b[30m', //Cyan BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    //wikia says this is random
   
    //Lambda's routing conditions
    if (sc.aBB + sc.aCV <= 1) type = "BB + CV <= 1 (M) ";
    else if (sc.aCV > 0) type = "Has a CV(B/L) (M) ";
    else type = "other (random M/L) ";
    
    /*Lambda's first condition seems to be correct, but other than that the routing seems to be random.
    Example of fleet that goes both M and L : 2 DD FBB CL CLT CVL
    So routing is likely random, split 75/25 M/L */

   
    return type;
}