exports.map = "43-3";
exports.node = "T";
exports.nodesToIgnore = [];
exports.nodeColors = {};

exports.getType = (entry, edgeNames) => {
    if(entry.difficulty != 4) return "not hard";

    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let h = getHistoricalCount(entry).all;
    let sc = getSpecialCombines(s);
    // let drumCount = getItemCount(entry, 75);
    // let drummedShipsCount = getShipWithItemCount(entry, 75);
    let radars = [28, 88, 240, 307, 315, 31, 32, 89, 124, 141, 278, 279, 142];
    let radarC = getShipWithItemsCount(entry, radars)

    if (sc.aBBCVnoL >= 4) return ">= 4 BB+CV(B/L)";
    if (entry.fleettype == 0) return "Single Fleet";
    if (entry.nodeinfo.amountOfNodes < 39) return "ZZ not unlocked";
    if (entry.fleet1[0].equip.filter((eId) => radars.includes(eId)).length == 0) return "No FS radar";

    if (sc.aBBCV >= 4) return ">= 4 BB+CV(L) " + radarC + " radars"
    if (sc.aSS) return "a SS";
    if (radarC > 5) return ">= 6 radars";
    else return "< 6 radars"
    return radarC + " radars";
    //return  getUnorderedFleetComp(s) + " " + radarC + " radars"

    //if(type == '丁 0')
    //    return `${getDifficulty(entry)} ${Object.keys(h).map((k) => `${k}: ${h[k]}`).join(" ")}`;

    let type = "other";
    return type;
}