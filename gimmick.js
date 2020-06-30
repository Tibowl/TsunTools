// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')

global.currentDir = __dirname;


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

if (!fs.existsSync(`${global.currentDir}/config/gimmick.json`)) {
    console.error(`Missing config/gimmick.json`);
    return;
}

global.dblogin = require(`${global.currentDir}/config/dblogin.json`);
global.edges = require(`${global.currentDir}/config/edges.json`);
global.idtobasename = require(`${global.currentDir}/config/idtobasename.json`);
global.historicalFleets = require(`${global.currentDir}/config/historicals.json`);


if(process.argv.length <= 2) {
    console.log("Usage: node gimmick <map>");
    console.log("Example: node gimmick 48-3");
    return;
}

const map = process.argv[2];
const diff_mapping = {"1": "Casual", "2": "Easy", "3": "Medium", "4": "Hard"};
const obj = {};
const abobj = {}
for (let i = 1; i <= 4; i++) {
    obj[i] = {};
    abobj[i] = {};
}

let counter = 0;
let edgesToNode = node => edges["World " + map][node][1];

console.log(`Node unlock gimmick in ${map}`);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM gimmick WHERE id > 118949 AND map = $1`, [map], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    for(let entry of entries) {
        const difficulty = entry.difficulty;
        if (entry.trigger == 'nodeBattle') {
            const lastBattle = entry.battles[entry.battles.length - 1];
            const phase = lastBattle.api_m1;
            const node = edgesToNode(lastBattle.node);
            if (!obj[difficulty][phase]) obj[difficulty][phase] = {};
            obj[difficulty][phase][node] = true;
        }
        else if (entry.trigger == 'nodeAB') {
            const lastDef = entry.lbasdef[entry.lbasdef.length - 1];
            const phase = lastDef.api_m1;
            abobj[difficulty][phase] = true;
        }
    }

    // Generate summary
    for (let difficulty in obj){
        console.log(`${diff_mapping[difficulty]} Mode`);
        for (let phase in obj[difficulty]) {
            const nodes = Object.keys(obj[difficulty][phase]);
            console.log(`Phase ${phase}: ${nodes} ${abobj[difficulty][phase] ? "(LB Defense Required)" : ""}`);
        }
        console.log();
    };
    client.end();
});
