// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')
require('./routers/helperFunctions.js');

global.currentDir = __dirname;

if(!fs.existsSync(`${global.currentDir}/config/stype.json`)) {
    console.error(`Missing config/stype.json, grab them from:
https://github.com/KC3Kai/kc3-translations/blob/master/data/en/stype.json`);
    return;
}

if (!fs.existsSync(`${global.currentDir}/config/edges.json`)) {
    console.error(`Missing config/edges.json, grab them from:
https://github.com/KC3Kai/KC3Kai/blob/update-cumulative/src/data/edges.json`);
    return;
}

if (!fs.existsSync(`${global.currentDir}/config/idtobasename.json`)) {
    console.error(`Missing config/idtobasename.json, you can generate them with KC3 by executing:
let remodels = {};
Object.values(KC3Master.all_ships()).filter((s) => s.api_id < 700).forEach((s) => {remodels[s.api_id] = KC3Meta.shipName(KC3Master.ship(RemodelDb.originOf(s.api_id)).api_name)});
copy(JSON.stringify(remodels,0,4));`);
    return;
}

if(!fs.existsSync(`${global.currentDir}/config/historicals.json`)) {
    console.error(`Missing config/historicals.json`);
    return;
}

if (!fs.existsSync(`${global.currentDir}/config/dblogin.json`)) {
    console.error(`Missing database login information, 'config/dblogin.json' doesn't exist!
Set contents to:
{
  "user": "xxx",
  "host": "xxx",
  "database": "xxx",
  "password": "xxx",
  "port": 1234
}`);
    return;
}

global.dblogin = require(`${global.currentDir}/config/dblogin.json`);
global.stype = require(`${global.currentDir}/config/stype.json`);
global.edges = require(`${global.currentDir}/config/edges.json`);

global.idtobasename = require(`${global.currentDir}/config/idtobasename.json`);
global.historicalFleets = require(`${global.currentDir}/config/historicals.json`);

// Check if all ships in historical fleets stuff exist
for (let fleet in historicalFleets) 
    for(let ship of historicalFleets[fleet])
        if(typeof ship == 'string' ? Object.values(idtobasename).indexOf(ship) < 0 : idtobasename[ship] == undefined) {
            console.warn(`\x1b[33m!!! Unknown ship ${ship} in ${fleet} historicals!\x1b[0m`);
        }


// Processing of user stuff
if(process.argv.length <= 2) {
    console.log("Usage: node routing <router>");
    console.log("Routers are .js files located in routers/*");
    console.log("");
    console.log("Example: node routing 1-5/D");
    console.log("");
    console.log("Some routers can have args:");
    console.log("Example: node routing los 1-5 D 1");
    return;
}

global.routing = {"total": {}, "other": {"other": {}}, "all": {"all": {}}};
let usingColors = ['\x1b[36m', '\x1b[33m', '\x1b[35m', '\x1b[32m', '\x1b[37m', '\x1b[46m', '\x1b[41m']

let router = require(`${global.currentDir}/routers/${process.argv[2]}`);
if (router.args) router.args(process.argv.slice(3))
let {map, node, nodesToIgnore, nodeColors, getType} = router;

if(!map || !node) {
    console.log("Map and/or node not defined in router!");
    return;
}

let edgesFromNode = Object.keys(edges["World " + map]).filter((edge) => {
    let e = edges["World " + map][edge];
    return e[0] == node && !nodesToIgnore.includes(e[1])
}).map((edge) => parseInt(edge));

console.log(`Edges from ${map} ${node}: `, edgesFromNode);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM ${parseInt(map.split("-")[0]) < 10 ? 'normalworld' : 'eventworld'} WHERE map = $1 AND edgeid[array_length(edgeid, 1)] = ANY($2) ORDER BY id`, [map, edgesFromNode], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    for(let entry of entries) {
        let edgeIds = entry.edgeid;
        
        //Verify if nodes are correctly ordered
        /*let lastNode = "Start";
        let nodeLetters = "";
        for(let edge of edgeIds) {
            let edgeNames = edges["World " + entry.map][edge];
            nodeLetters += edgeNames[0] + " -> " + edgeNames[1] + ", "
            if(lastNode !== "Start" && lastNode !== edgeNames[0])
                console.log("OhNo", nodeLetters, entry);
            lastNode = edgeNames[1];
        }*/

        // Node filter
        let edgeNames = edges["World " + entry.map][edgeIds[edgeIds.length - 1]]
        if(edgeNames[0] != node)
            continue;       
        if(nodesToIgnore.includes(edgeNames[1]))
            continue;

        // Ignore entries with no ships AkiLost
        if(!entry.fleet1.length)
            continue;

        // Filter out flee'ed ships
        entry.fleet1 = entry.fleet1.filter((ship) => !ship.flee);
        entry.fleet2 = entry.fleet2.filter((ship) => !ship.flee);

        // Count totals
        let rs = routing["all"]["all"];
        rs[edgeNames[1]] = (rs[edgeNames[1]]||0) + 1;
        
        let type = getType(entry, edgeNames);

        let subtype = type == 'other' ? 'other' : 'total'
        rs = routing[subtype][type]||{};
        rs[edgeNames[1]] = (rs[edgeNames[1]]||0) + 1;
        routing[subtype][type] = rs;
    }
    
    // Generate summary
    console.log(`==== Routing info from ${map} / node ${node} ====`);
    let id = 0;
    for(let type in routing) {
        let excludedType = type == "total" || type == "all" || type == "other";

        if(Object.keys(routing[type]).length == 0 || (Object.keys(routing[type]).length == 1 && Object.keys(routing[type])[0] == '0'))
            continue;

        for(let kind of Object.keys(routing[type]).sort()) {
            let rs = routing[type][kind];
            let total = 0;
            for(let node in rs) {
                total += rs[node];
                if(!nodeColors[node])
                    nodeColors[node] = usingColors[id++]
            }
            for(let node of Object.keys(rs).sort()) {
                let c = '';
                if(rs[node] == total) c = '\x1b[32m';
                if(excludedType)
                    console.log(kind + " ->" + nodeColors[node] + node + "\x1b[0m: " + c + Math.round(rs[node] / total * 100) +"%\x1b[0m (" + rs[node] + ")")
                else
                    console.log(type + ": " + kind + " ->" + nodeColors[node] + node + "\x1b[0m: " + c + Math.round(rs[node] / total * 100) +"%\x1b[0m (" + rs[node] + ")")
            }
        }
        console.log()
    }
    client.end();
});
