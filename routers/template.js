exports.map = "world-mapnum";
exports.node = "startingletter";
exports.nodesToIgnore = [];
exports.nodeColors = {
    //'A': '\x1b[42m\x1b[30m', // Green BG
    //'B': '\x1b[42m\x1b[30m', // Green BG
    //'C': '\x1b[41m\x1b[37m', // Red BG
    //'D': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    // let h = getHistoricalCount(entry).all;
    let sc = getSpecialCombines(s);
    // let drumCount = getItemCount(entry, 75);
    // let drummedShipsCount = getShipWithItemCount(entry, 75);

    let type = "other";

    // Fleet size
    //type = entry.fleet1.length + " ship" + (entry.fleet1.length == 1?"":"s");

    // Flagship
    //if(entry.fleet1[0])
    //    return stype[entry.fleet1[0].type]

    // Type = LoS, getLoS(entry, Cn)
    //let los;
    //type = getDifficulty(entry) + pad(Math.floor(los = getLoS(entry, 4)))
    //if(los < 0) type = "neg los"

    // Type = ship speed
    //type = entry.fleetspeed;

    // Figure out other ship reqs, per stype basis
    //if(type == "other") advancedStypeCounter(entry, s, edge)
    //if(type == "other") advancedStypeCounter(entry, Object.assign({}, s, sc, {'aShip': entry.fleet1.length}), edge)

    // Figure out other ship reqs, per fleet basis
    //if(type == "3 (F)BB(V)+CV(L/B) 2 DD+DE") type = getUnorderedFleetComp(s)
    //if(type == "other") type = getOrderedFleetComp(entry)

    // Figure out unkown offrouting
    //if(edge == 'X' && type == "2 DD") console.log(/*entry, */getOrderedFleetComp(entry) + " -> " + edge) 
    //if(type == '0 ships') console.log(JSON.stringify(entry))
    return type;
}