// Loading of general data/functions.
const fs = require('fs'),
    { Client } = require('pg')

global.currentDir = __dirname;



if (!fs.existsSync(`${global.currentDir}/config/idtobasename.json`)) {
    console.error(`Missing config/idtobasename.json, you can generate them with KC3 by executing:
let remodels = {};
Object.values(KC3Master.all_ships()).filter((s) => s.api_id < 700).forEach((s) => {remodels[s.api_id] = KC3Meta.shipName(KC3Master.ship(RemodelDb.originOf(s.api_id)).api_name)});
copy(JSON.stringify(remodels,0,4));`);
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
global.tests = require(`${global.currentDir}/config/gunfits.json`);

global.idtobasename = require(`${global.currentDir}/config/idtobasename.json`);

// Processing of user stuff
if(process.argv.length <= 2) {
    console.log("Usage: node gunfit <testnum> <time> <morale(optional)>");-
    console.log("");
    console.log("Example: node gunfit 1 Day orange");
    return;
}

const testnum = process.argv[1];
const time = process.argv[2];
const getMoraleMod = morale => {
    const key = [19,33,49,100].findIndex(foo => morale <= foo);
    return [0.5,0.8,1,1.2][key];
}
let morale;
if(process.argv.length == 4) { 
    morale = process.argv[3];
    const checkNum =
        {
            red: [0, 19],
            orange: [20, 32],
            green: [33, 49],
            sparkled: [50, 100]
        }[morale];
    const checkMorale = (morale, checkNum) => morale >= checkNum[0] && morale <= checkNum[1];
}
const test = tests[testnum];
const formatPercent = num => Math.floor(num * 10000) / 100;


let enemy = {}, total = {cl0 : 0, cl1 : 0, cl2 : 0}, basic = 0;
global.shipdata = require(`${global.currentDir}/damage/kcSHIPDATA.js`)['shipdata'];


console.log(`Checking gunfits in test ${testnum}, ${time}` + !morale ? '' : ` in ${morale} morale`);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM gunfit WHERE testid = $1 ORDER BY id`, [testnum], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    for(let entry of entries) {
        const shipMorale = entry.ship.morale
        if ((morale && !checkMorale(shipMorale, checkNum)) || time != entry.time) { continue; }
        total["cl" + entry.api_cl]++;
        enemy[entry.enemy] = (enemy[entry.enemy] || 0) + 1;
        const moraleMod = getMoraleMod(shipMorale);
        basic += entry.accval * moraleMod;
    }
    
    // Generate summary
    console.log(`==== Accuracy summary of test ${testnum}` + !morale ? '' : ` in ${morale} morale ====`);
    const crit = total.cl2, hit = total.cl1 + crit, miss = total.cl0, num = hit + miss;
    let ev = 0;
    for(let key in enemy) {
        const ship = shipdata[key];
        ev += (ship.EV + Math.sqrt(2 * ship.LUK)) * enemy[key];
    }
    ev = ev / num;
    const expectedHitRate = basic / num - ev;
    const critRate = crit / num;
    const actualHitRate = hit / num;
    const error = Math.sqrt(actualHitRate * (1 - actualHitRate) / num);
    const lowBound = actualHitRate - error,  highBound = actualHitRate + error;
    console.log(`Actual: ${formatPercent(actualHitRate)}, Expected: ${formatPercent(expectedHitRate)}, Diff: ${formatPercent(actualHitRate - expectedHitRate)}` )
    console.log(``)
    console.log(`Standard Error: ${formatPercent(error)}, Bounds: ${formatPercent(lowBound)} ~ ${formatPercent(highBound)}, Crit Rate: ${formatPercent(critRate)}`)
    client.end();
});
