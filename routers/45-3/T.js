exports.map = "45-3";
exports.node = "K";
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
    if(edge == "S") return "S";

    return `${getDifficulty(entry)} ${s.BB+s.BBV+s.FBB} (F)BB(V) ${s.CV+s.CVB+s.CVL} CV(B) ${s.CA+s.CAV} CA(V)`;

    let type = "other";
    return type;
}