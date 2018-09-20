exports.map = "42-5";
exports.node = "L";
exports.nodesToIgnore = [];
exports.nodeColors = {
    'O': '\x1b[42m\x1b[30m', // Green BG
    'N': '\x1b[41m\x1b[37m', // Red BG
};

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    let h = getHistoricalCount(entry).all;
    let sc = getSpecialCombines(s);
    // let drumCount = getItemCount(entry, 75);
    // let drummedShipsCount = getShipWithItemCount(entry, 75);

    let type = "other";
    type = `${getDifficulty(entry)} ${h['Kriegsmarine'] + h['Marine Nationale']}`;
    //if(type == '丁 0')
    //    return `${getDifficulty(entry)} ${Object.keys(h).map((k) => `${k}: ${h[k]}`).join(" ")}`;

    return type;
}