exports.map = "42-5";
exports.node = "L";
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
    let h = getHistoricalCount(entry).all;
    let sc = getSpecialCombines(s);
    // let drumCount = getItemCount(entry, 75);
    // let drummedShipsCount = getShipWithItemCount(entry, 75);

    let type = "other";
    return `${getDifficulty(entry)} ${h['Kriegsmarine'] + h['Marine Nationale']}`;
}