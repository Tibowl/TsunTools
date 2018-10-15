// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')

global.currentDir = __dirname;

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


// Processing of user stuff
if(process.argv.length <= 2) {
    console.log("Usage: node airpower <enemyid> <flag>");-
    console.log("");
    console.log("Example: node airpower 1823 true");
    return;
}

global.airpower = {};
let usingColors = ['\x1b[36m', '\x1b[33m', '\x1b[35m', '\x1b[32m', '\x1b[37m', '\x1b[46m', '\x1b[41m']

const enemyid = process.argv[2];
const searchFlag = process.argv[3];
const temp = {
    minFP: 9999,
    maxFP: 0,
    total: 0,
    bomber: 9999,
}
const terms = {
    0: "AP",
    1: "AS+",
    2: "AS",
    3: "AD",
    4: "AI"
}

const template = function() {
for (let i = 0; i < 5; i++) { this[i] = Object.assign({}, temp, { lost: [] }); }
}
const onlyUnique = function(value, index, self) { 
    return self.indexOf(value) === index;
};


console.log(`Checking airpower for enemy ${enemyid}`);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM enemycomp WHERE (enemycomp#>>'{ship,0}')::int = $1 AND airbattle IS NOT NULL AND (airbattle->>'jetPhase')::boolean = false AND 
(airbattle->>'bakFlag')::boolean IS NULL ORDER BY id`, [enemyid], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    for(let entry of entries) {
        const enemy = entry.enemycomp.ship;
        if (entry.enemycomp.shipEscort) enemy.push(...entry.enemycomp.shipEscort);
        const key = ""+enemy;
        if (!airpower[key]) {
            airpower[key] = {
                fleet: new template(),
                lbas: new template(),
           };
        }
        const airBattle = entry.airbattle;
        const root = airpower[key][airBattle.landBase ? "lbas" : "fleet"][airBattle.state];
        if (root.minFP > airBattle.fighterPower[0]) root.minFP = airBattle.fighterPower[0];
        if (root.maxFP < airBattle.fighterPower[0]) root.maxFP = airBattle.fighterPower[0];
        if (root.total == 0) root.total = airBattle.total;
        root.lost.push(airBattle.lost);
        if (airBattle.bomber) root.bomber = (root.bomber > airBattle.bomber) ? airBattle.bomber : root.bomber;
    }

    // Generate summary
    console.log(`==== Fighter powers ====`);
    for (const comp in airpower){
        console.log(comp);
        for (const type in airpower[comp]) {
            console.log(type);
            let str = "";
            for (const seiku in airpower[comp][type]) {
                const d =  airpower[comp][type][seiku];
                str += terms[seiku] + "\x1b: [" + d.minFP + " ~ " + d.maxFP + "] ";
                if (searchFlag) { 
                    d.lost = d.lost.filter(onlyUnique);
                    d.lost.sort((a,b) => a - b);
                    str += "Total: " + d.total;
                    if (d.bomber) str += " Bomber: " + d.bomber + "\n";
                    if (d.lost.length) str +=  d.lost + "\n\n";
                }
            }
            str += "\n";
            console.log(str);
        }
    }
    client.end();
});
