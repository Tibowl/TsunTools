exports.nodesToIgnore = [];
exports.nodeColors = {};

let data = "";

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let sa = getStypeCount(entry).all;
    let sc = getSpecialCombines(sa);
    //let s2 = getStypeCount(entry).fleet2;
    // let h = getHistoricalCount(entry).all;
    
    data += []
        .concat(stype.slice(1).map((t) => sa[t]))
        .concat(Object.keys(global.specialCombines).map((t) => sc[t]))
        .concat(entry.fleet1.length)
        .concat([1,2,3,4].map((Cn) => getLoS(entry, Cn)))
        .concat(entry.cleared)
        .concat(entry.sortiedfleet)
        .concat(entry.fleetspeed)
        .concat(edge)
        .join(",") + '\n'

    return "other";
}

exports.args = (args) => {
    if (args.length < 2) {
        console.log("arff requires 2 args: <map> <node>")
        return;
    }

    exports.map = args[0];
    exports.node = args[1];
    /*
        data format: fleet1 stypes, fleet2 stypes, LoS1234, fleetSpeed, edge
    */
    data = `@relation ${exports.map}-${exports.node}

${/* stype fleet1*/stype.slice(1).map((t) => `@attribute fleet1-${t} NUMERIC`).join("\n")}
${/* combined types*/Object.keys(global.specialCombines).map((t) => `@attribute fleet1-${t} NUMERIC`).join("\n")}
@attribute fleet1-shipCount NUMERIC
${/* LoS */[1,2,3,4].map((Cn) => `@attribute LoS-Cn${Cn} NUMERIC`).join("\n")}
@attribute cleared {true,false}
@attribute sortiedFleet NUMERIC
@attribute fleetSpeed NUMERIC
@attribute edge {${
Object.keys(edges["World " + exports.map]).map((edge) => {
    let e = edges["World " + exports.map][edge];
    return e[0] == exports.node ? e[1] : 0
}).filter((e) => e).join(",")}}

@data
`
}

exports.onFinish = () => {
	var fs = require('fs');
	fs.writeFile(`./arff/${exports.map}.${exports.node}.arff`, data, function(err) {
		if(err) {
			return console.log(err);
		}

		console.log("Samples have been exported to .arff file!");
	});
}