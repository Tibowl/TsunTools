// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')

global.currentDir = __dirname;


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

if (!fs.existsSync(`${global.currentDir}/config/idTL.json`)) {
    console.error(`Missing config/idTL.json, see friendfleets how to generate;`);
    return;
}

const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const edges = require(`${global.currentDir}/config/edges.json`);
const idTL = require(`${global.currentDir}/config/idTL.json`);


if(process.argv.length != 6) {
    console.log("Usage: node unexpected <map> <node> <ship> <rank>");
    console.log("Example: node dupeCount 44-5 Z Intrepid S");
    return;
}

const map = process.argv[2];
const node = process.argv[3];
const rank = process.argv[5];
let shipid = Object.keys(idTL.ships).filter((id) => idTL.ships[id].en == process.argv[4])
if(shipid.length == 1)
    shipid = shipid[0]
else {
    console.log("Invalid name");
}
let edgesFromNode = Object.keys(edges["World " + map]).filter((edge) => {
    let e = edges["World " + map][edge];
    return e[1] == node;
}).map((edge) => parseInt(edge));

console.log(`Dupe drops in ${map} ${node} for ${shipid}`, edgesFromNode);

const client = new Client(dblogin);
client.connect();


let startTime = new Date();
client.query(`SELECT difficulty, ship, COALESCE((counts->>$1::text)::int,0) AS dupecount, COUNT(id) FROM shipdrop WHERE id > 12000000 AND map = $2 AND rank = $3 AND node = ANY($4) GROUP BY difficulty, ship, dupecount`, [shipid, map, rank, edgesFromNode], (err, data) => {
    let endTime = new Date();
    client.end();
    if(err) {
        console.log(err);
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)

    let parsed = {}
    for(let entry of entries) {
        entry.count = parseInt(entry.count);
        if(!parsed[entry.difficulty]) parsed[entry.difficulty] = {}
        if(!parsed[entry.difficulty][entry.dupecount])
            parsed[entry.difficulty][entry.dupecount] = {
                "total": 0,
                "dropped": 0
            }
        parsed[entry.difficulty][entry.dupecount].total += entry.count
        if(entry.ship == shipid)
            parsed[entry.difficulty][entry.dupecount].dropped += entry.count
    }
    
    // Generate summary
    console.log(`==== Dupe drops for ${idTL.ships[shipid].jp} in ${map} / node ${node} (${rank} rank) ====`);
    for(let diff in parsed)
        for (let dupecount in parsed[diff]) {
            let data = parsed[diff][dupecount];

            console.log(`${['?', '丁', '丙', '乙', '甲'][diff]}${dupecount}x ${(data.dropped / data.total * 100).toFixed(2)}% (${data.dropped}/${data.total})`)
        }
});
