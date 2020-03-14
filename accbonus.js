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

const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const edges = require(`${global.currentDir}/config/edges.json`);
const foo = {}, bar = [];
const shipdata = require(`${global.currentDir}/damage/kcSHIPDATA.js`)['shipdata'];
const a = require(`${global.currentDir}/damage/kcEQDATA.js`);
const eqdata = a.EQDATA;
const eqtdata = a.EQTDATA;

const form = {
    1: 1,
    2: 0.9,
    3: 0.7,
    4: 0.8,
    5: 0.8
};

const special = {
    0: 1,
    1: 1.1,
    2: 1.5,
    3: 1.65,
    4: 1.5,
    5: 2.0
};

const eform = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1.1,
    5: 1.2
}

function getBaseId(mid) {
    var ship = shipdata[mid];
    while(ship) {
        if (!ship.prev) break;
        mid = ship.prev;
        ship = shipdata[ship.prev];
    }
    return mid;
}

function isScratch(damage, health) {
    health = Math.max(0, health);
    return damage >= Math.floor(health * 0.06) && damage <= Math.max(0, Math.floor((health*0.06 + (health-1)*0.08)));
}

function formatNum(num) {
    return Math.floor(num * 100) / 100;
}
    

if(process.argv.length <= 5) {
    console.log("Usage: node accBonus <map> <node> <shipid> <enemyid>");
    console.log("Currently only extended to night battle, and does not take into account fit bonuses");
    console.log("Also does not consider if setup is able to pen or scratch")
    return;
}
const map = process.argv[2], node = process.argv[3], ship = process.argv[4], enemy = process.argv[5];

let edgesToNode = Object.keys(edges["World " + map]).filter((edge) => {
    let e = edges["World " + map][edge];
    return node == (e[1]);
}).map((edge) => parseInt(edge)); 

const client = new Client(dblogin);
client.connect();

client.query(`SELECT * FROM spattack WHERE id > 22366229 time = 'yasen' AND map = $1 AND node = ANY($2) AND (ship->>'id')::int = $3 AND (misc->>'enemy')::int = $4 AND (misc->>'formation') IS NOT NULL`, [map, edgesToNode, ship, enemy], (err, data) => {
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`Found ${entries.length} entries`);
    for (let instance of entries) {    
    
        let acc = 69;
        if (instance.misc.playerStarshell) acc += 5;
        acc *= (instance.misc.contact === 102 ? 1.1 : 1);
        acc += 2 * Math.sqrt(instance.ship.lvl) + 1.5 * Math.sqrt(instance.ship.stats.lk);
        instance.ship.equips.forEach((equip, index) => {
            const eq = eqdata[equip];
            if (eq) {
                acc += (eq.ACC || 0);
                if (instance.ship.improvements[index] > 1) {
                    const improvement = instance.ship.improvements[index];
                    const type = eqtdata[eq.type];
                    if (type.improve && type.improve.ACCnb) {
                        acc += type.improve.ACCnb * Math.sqrt(improvement);
                    }
                }
            }
        });

        const enemyForm = instance.misc.formation[1];
        if (!eform[enemyForm]) { continue; }
        bar[enemyForm] = (bar[enemyForm] || 0) + 1;

        const morale = instance.ship.morale;
        if (morale > 50) { acc *= 1.2; }
        else if (morale < 20) { acc *= 0.5; }
        else if (morale < 30 ) { acc *= 0.8; }
        
        const playerForm = instance.misc.formation[0];
        if (!form[playerForm]) { continue; }
        acc *= form[playerForm];

        const cutin = instance.cutin;
        if (!special[cutin]) { continue; }
        acc *= special[cutin];

        if (instance.misc.fleetSearchlight) {acc += 7;}
        const actual = acc;
        acc = Math.floor(acc/10) * 10;
        acc = `${acc} ~ ${acc + 9}`;

        foo[acc] = (foo[acc] || {hit: 0, miss: 0, crit: 0, actuals: []});
        foo[acc].actuals.push(actual);

        const accArray = instance.misc.acc;
        let ehp = instance.misc.ehp;

        for (let i = 0; i < accArray.length; i++) {
            if (accArray[i] === 2) foo[acc].crit++;
            else if (accArray[i] === 0) foo[acc].miss++;
            else if (cutin === 0 || !isScratch(instance.misc.damage[i], ehp)) foo[acc].hit++;
            else {foo[acc].miss++;}
            
            ehp -= instance.misc.damage[i];
        }
    }

    const edata = shipdata[enemy];
    let eflag = false, avgEva = 0;
    if (edata && !edata.unknownStats) {
        eflag = true;
        let base = edata.EV + Math.sqrt(2 * edata.LUK);
        for (let slot of edata.EQUIPS) {
            const eqd = eqdata[slot];
            base += (eqd.EV || 0);
        }
        let t = 0;
        for (let enemyForm in bar) {
            t += bar[enemyForm];
            let baseEva = Math.floor(base * eform[enemyForm]);
            if (baseEva >= 65) { baseEva = Math.floor(55 + 2 * Math.sqrt(baseEva - 65)); }
            else if ( baseEva < 40 ) { baseEva = baseEva; }
            else { baseEva = Math.floor(40 + 3 * Math.sqrt( baseEva - 40 )); }

            avgEva += baseEva * bar[enemyForm];
        }
        avgEva = avgEva / t;
    }

    console.log(`Accuracy of ship ${shipdata[ship] ? shipdata[ship].name : ship} against ${shipdata[enemy] ? shipdata[enemy].name : enemy} in map ${map}${node}`)
    for (let key in foo) {
        const obj = foo[key];
        const averageAccuracy = obj.actuals.reduce((a, b) => a + b, 0) / obj.actuals.length;
        const total = obj.crit + obj.miss + obj.hit;
        if (total < 50) { continue; }
        const hits = obj.crit + obj.hit;
        const actualHitRate = formatNum(hits / total);
        let estStr = "";
        if (eflag) {
            estStr = `, Projected Hit Rate: ${formatNum(averageAccuracy - avgEva) + 1}%`
        }
        console.log(`Accuracy Value: ${key}, Hit Rate: ${actualHitRate * 100}% (${hits}/${total})` + estStr);
    }

    client.end();
});

