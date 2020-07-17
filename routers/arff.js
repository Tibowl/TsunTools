exports.nodesToIgnore = [];
exports.nodeColors = {};

let data = "";
let isEvent = false;
let previousFleets = {}
let randomCount = 0;

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s1 = getStypeCount(entry).fleet1;
    let sa = getStypeCount(entry).all;
    let radarC = getShipWithItemsCount(entry, [28, 28, 88, 240, 307, 315, 31, 32, 89, 124, 141, 278, 279, 142])
    
   let sample = []
        .concat(stype.slice(1).map((t) => s1[t]))
        .concat(Object.keys(global.specialCombines).map((t) => getSpecialCombines(s1)[t]))
        .concat(entry.fleet1.length)
        .concat(radarC);
    if(isEvent)
        sample = sample
            .concat(["Single","CTF","STF","TCF"][entry.fleettype])
            .concat(stype.slice(1).map((t) => sa[t]))
            .concat(Object.keys(global.specialCombines).map((t) => getSpecialCombines(sa)[t]))
            .concat(Object.keys(historicalFleets).map((t) => getHistoricalCount(entry).all[t]))
            .concat(entry.fleet1.length + entry.fleet2.length)
            .concat(entry.currentmaphp)
            .concat(["?","C","E","M","H"][entry.difficulty])
            .concat(entry.nodeinfo.amountOfNodes || entry.nodeinfo.amountofnodes)
            .concat(entry.gaugenum)

        sample = sample.concat([1,2,3,4].map((Cn) => getLoS(entry, Cn)))
        .concat(entry.cleared)
        .concat(entry.sortiedfleet)
        .concat(entry.fleetspeed);
    let pNode = previousFleets[sample.join(",")];

    if (randomCount < 100 && pNode && pNode != edge) {
        console.log("Detected random entry!", pNode, edge, entry)
        randomCount++;
    } else if (randomCount < 100)
        previousFleets[sample.join(",")] = edge

    sample = sample.concat(edge)

    data += sample.join(",") + '\n'
    return "other";
}

exports.args = (args) => {
    if (args.length < 2) {
        console.log("arff requires 2 args: <map> <node>")
        return;
    }

    exports.map = args[0];
    exports.node = args[1];
    isEvent = parseInt(exports.map) > 10;

    data = `@relation ${exports.map}-${exports.node}

${/* stype fleet1*/stype.slice(1).map((t) => `@attribute fleet1-${t} NUMERIC`).join("\n")}
${/* combined types*/Object.keys(global.specialCombines).map((t) => `@attribute fleet1-${t} NUMERIC`).join("\n")}
@attribute fleet1-shipCount NUMERIC
@attribute fleet1-radarCount NUMERIC${!isEvent?"":
/* Event only stuff*/
`
@attribute fleettype {Single,CTF,STF,TCF}
${/* stype fleetBoth*/stype.slice(1).map((t) => `@attribute fleetBoth-${t} NUMERIC`).join("\n")}
${/* combined types*/Object.keys(global.specialCombines).map((t) => `@attribute fleetBoth-${t} NUMERIC`).join("\n")}
${Object.keys(historicalFleets).map((t) => `@attribute historical-${t.replace(" ", "_")} NUMERIC`).join("\n")}
@attribute fleetBoth-shipCount NUMERIC
@attribute currentmaphp NUMERIC
@attribute difficulty {C,E,M,H}
@attribute unlockedNodes NUMERIC
@attribute gauge NUMERIC`
/**/}
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
        if (randomCount > 0)
            console.log("NOTE: This node has most likely random routing (sample with same attributes went to multiple nodes)");
	});
}