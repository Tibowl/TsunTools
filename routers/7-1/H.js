exports.map = "7-1";
exports.node = "H";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'K': '\x1b[41m\x1b[37m', // Red BG
    'I': '\x1b[42m\x1b[37m', //Green BG
    'J': '\x1b[46m\x1b[37m', //Cyan BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let sc = getSpecialCombines(s);

    let type = "other";

    /* routing condition priority (WIP)
        So far two gauranteed boss route comps (?)
        1 CL 4 DD
        1 CL 1 DD 3 DE

        Otherwise for 4 and 5 ship comps there is random routing. Can only go to J if 4 or less ships (?). 
        Seems like 70/30 (?) split for K/I when having 5 ships and 70/20/10 (?) for K/I/J when having 4 ships.
        */

    if (s.CL == 1 && s.DD == 4) type = "1 CL 4 DD (K) ";
    else if (s.CL == 1 && s.DD == 1 && s.DE == 3) type = "1 CL 1 DD 3 DE";
    else if (entry.fleet1.length == 5) type = "5 ships ";
    else if (entry.fleet1.length == 4) type = "4 ships ";
    

    
    //if (type == "5 ships " && edge == "I") console.log(getOrderedFleetComp(entry) + " -> " + edge);
    if (type == "Includes AO " && edge == "I") console.log(getOrderedFleetComp(entry) + " -> " + edge);




    return type;
}// JavaScript source code
