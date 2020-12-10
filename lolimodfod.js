const fs = require('fs'),
    { Client } = require('pg'),
    read = require('readline-sync');

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

const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const shipdata = require(`${global.currentDir}/damage/kcSHIPDATA.js`)['shipdata'];

function bounds(s, n) {
    let p = s/n;
    let k = error(p, n);
    return [p - k, p + k];
}
function error(p, n) {
    return Math.sqrt(p * (1 - p) / n);
}
function percentage(p, d = 3) {
    return `${(p * 100).toFixed(d)}%`
}
const range = r => {
    if(r[0] == r[1]) return r[0] + "";
    return r.join(" ~ ");
}

let startTime = new Date();
const client = new Client(dblogin);
client.connect();
client.query(`SELECT * FROM lolimodfod ORDER BY id`, [], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    
    let entries = data.rows;
    console.log(`${entries.length} samples loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    
    let stats = {}
    entryloop: for (let entry of entries) {
        for(let id of entry.modids)
            if(!shipdata[id]) {
                console.warn("Unknown ship " + id);
                continue entryloop;
            }
        let types = entry.modids.map((id) => shipdata[id].type);

        // DE only mods
        if(types.filter(k => k != "DE").length > 0) continue;
        //if(entry.modids.filter(id => [451,348].indexOf(id) == -1).length > 0) continue;
        //if(entry.modids.filter(id => [162,499].indexOf(id) == -1).length > 0) continue;

        // Count filter
        if(types.length != 1) continue;

        // Same ctype only
        if(entry.modids.map(id => shipdata[id].sclass).filter(sc => sc != shipdata[entry.modids[0]].sclass).length > 0) continue

        let lvl = [entry.modlvls
            .sort((a,b) => a-b)
            .reduce((a,b) => a+b)]
            .map(lvl => (Math.floor(lvl / 10)*10) +"~" + (Math.floor(lvl / 10) * 10 +9))
            //.map((lvl, ind) => (shipdata[entry.modids[ind]].nameJP.includes("改") ? "K" : "B") + (Math.floor(entry.modlvls[ind] / 10)*10) +"~" + (Math.floor(entry.modlvls[ind] / 10) * 10 +9))
            .join(",")
        //let lvl = entry.modlvls.join(",");
        if(stats[lvl] == undefined) stats[lvl] = {
            "hp": [0, 0],
            "asw": [0, 0],
            "luck": [0, 0]
        };

        for(let stat of [[4,"luck"],[5,"hp"],[6,"asw"]]) {
            let statBefore = entry.modbefore[stat[0]], statAfter = entry.modafter[stat[0]], statLeft = entry.modleft[stat[0]];
            if(statAfter > statBefore)
                statLeft = statLeft + statAfter - statBefore

            if(statLeft > 0) {
                stats[lvl][stat[1]][1] += 1;
                if(statAfter > statBefore)
                    stats[lvl][stat[1]][0] += 1;
            }
        }
    }
    for (let row in stats) {
        let stat = stats[row];
        if(stat.luck[1] >= 50)
            console.log(`${row.padStart(6)} HP: ${`${stat.hp[0]}/${stat.hp[1]}`.padStart(8)} (${percentage(stat.hp[0]/stat.hp[1],1).padStart(6)}) - ASW: ${`${stat.asw[0]}/${stat.asw[1]}`.padStart(8)} (${percentage(stat.asw[0]/stat.asw[1],1).padStart(6)}) - LCK: ${`${stat.luck[0]}/${stat.luck[1]}`.padStart(8)} (${percentage(stat.luck[0]/stat.luck[1],1).padStart(6)})`)
    }
	client.end();
});
