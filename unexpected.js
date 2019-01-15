// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')
require('./damage/helperFunctions.js');

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
global.gimmick = require(`${global.currentDir}/config/gimmick.json`)



// Check if all ships in historical fleets stuff exist
for (let fleet in historicalFleets) 
    for(let ship of historicalFleets[fleet])
        if(typeof ship == 'string' ? Object.values(idtobasename).indexOf(ship) < 0 : idtobasename[ship] == undefined) {
            console.warn(`\x1b[33m!!! Unknown ship ${ship} in ${fleet} historicals!\x1b[0m`);
        }

if(process.argv.length <= 3) {
    console.log("Usage: node unexpected <map> <node>");
    console.log("Example: node routing 43-3 Z");
    return;
}

const map = process.argv[2];
const node = process.argv[3];
global.eqdata = require(`${global.currentDir}/damage/kcEQDATA.js`)['EQDATA'];
global.shipdata = require(`${global.currentDir}/damage/kcSHIPDATA.js`)['shipdata'];
const idobj = {};

const multipliers = {
    precapMod: [0, 999],
    precapAdd: [-999, 999],
    postcapMod: [0, 999],
    postcapAdd: [-999, 999],
    criticalMod: [0, 999],
}

const compareArrays = (inc, curr) => {
    const res = [];
    res.push(curr[0] > inc[0] ? curr[0] : inc[0]);
    res.push(curr[1] < inc[1] ? curr[1] : inc[1]);
    return res;
};

let counter = 0;
let edgesFromNode = Object.keys(edges["World " + map]).filter((edge) => {
    let e = edges["World " + map][edge];
    return e[1] == node;
}).map((edge) => parseInt(edge));

console.log(`Unexpected damage in ${map} ${node} `, edgesFromNode);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM abnormaldamage WHERE map = $1 AND edgeid = ANY($2) ORDER BY id`, [map, edgesFromNode], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    for(let entry of entries) {
        if (!datafilter(entry)) { continue; }
        counter++;
        idobj[entry.ship.id] = idobj[entry.ship.id] || {};
        const postcapPower = entry.ship.postcapPower;
        const lowPower = entry.damageinstance.actualDamage / entry.ship.rAmmoMod + 0.7 * entry.enemy.armor;
        const highPower = lowPower + 0.6 * (entry.enemy.armor - 1);
        const lowMod = lowPower/postcapPower || 1;
        const highMod = highPower/postcapPower || 999;

        idobj[entry.ship.id].min = (idobj[entry.ship.id].min || 1) > lowMod ? (idobj[entry.ship.id].min || 1) : lowMod;
        idobj[entry.ship.id].max = (idobj[entry.ship.id].max || 999) < highMod ? (idobj[entry.ship.id].max || 999) : highMod;
        idobj[entry.ship.id].count = (idobj[entry.ship.id].count || 0) + 1;
    }
    
    // Generate summary
    console.log(`==== Unexpected damage in ${map} / node ${node} ====`);
    console.log(counter + " Samples");
    for (const key in idobj){
        if (shipdata[key]) console.log(shipdata[key].name + " - "+Math.floor(idobj[key].min*100)/100 + " ~ " + Math.floor(idobj[key].max*100)/100 + " ("+idobj[key].count+"x)");
    };
    client.end();
});
