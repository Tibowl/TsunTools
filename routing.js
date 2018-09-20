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

if(process.argv.length <= 2) {
    console.log("Usage: node routing <router>");-
    console.log("Routers are .js files located in routers/*");
    console.log("");
    console.log("Example: node routing 1-5/D");
    return;
}

let routing = {"total": {}, "other": {"other": {}}, "all": {"all": {}}};
let usingColors = ['\x1b[36m', '\x1b[33m', '\x1b[35m', '\x1b[32m', '\x1b[37m', '\x1b[46m', '\x1b[41m']

let {map, node, nodesToIgnore, nodeColors, getType} = require(`${global.currentDir}/routers/${process.argv[2]}`);

if(!map || !node) {
    console.log("Map and/or node not defined in router!");
    return;
}

let edgesToNode = Object.keys(edges["World " + map]).filter((edge) => {
    let e = edges["World " + map][edge];
    return e[0] == node && !nodesToIgnore.includes(e[1])
}).map((edge) => parseInt(edge));

console.log(`Edges to ${map}-${node}: `, edgesToNode);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM ${parseInt(map.split("-")[0]) < 10 ? 'normalworld' : 'eventworld'} WHERE map = $1 AND edgeid[array_length(edgeid, 1)] = ANY($2) ORDER BY id`, [map, edgesToNode], (err, data) => {
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
