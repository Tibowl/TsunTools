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

if (!fs.existsSync(`${global.currentDir}/config/gunfits.json`)) {
    console.error("Missing `config/gunfits.json`");
    return;
}

const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const tests = require(`${global.currentDir}/config/gunfits.json`);
const eqdata = require(`${global.currentDir}/damage/kcEQDATA.js`)['EQDATA'];

function checkTest() {
    if(testInput == undefined)
        return false;
    try {
        if(parseInt(testInput) - 1 < tests.length) {
            if(parseInt(testInput) - 1 < 0) {
                return false;
            }

            test = tests[parseInt(testInput) - 1];
            return true;
        }
    } catch (e) {}
    
    if(test = tests.find((t) => t.testName.toLowerCase() == testInput.toLowerCase()))
        return true;
    return false;
}

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
    if(r[0] == r[1]) return r[0];
    return r.join(" ~ ");
}
const getMoraleMod = morale => {
    const key = [28,32,52,100].findIndex(foo => morale <= foo);
    return [0.5,0.8,1,1.2][key];
};
const getSpAttackMod = (time, spAttack) => (time == 'Day' ?
    { 0: 1, 2: 1.1, 3: 1.3, 4: 1.5, 5: 1.3, 6: 1.2 } :
    { 0: 1, 1: 1.1, 2: 1.1, 3: 1.5, 4: 1.65, 5: 1.5 }
)[spAttack] || 1;
const getEquipAcc = equipId => eqdata[equipId].ACC || 0;
const evas = {
	"1501": 15,
	"1502": 16,
	"1503": 17,
	"1505": 16,
	"1506": 16
}

if(process.argv.length <= 2) {
    console.log("Quick usage: node gunfits <test name OR id> <time: Day/Yasen> (morale: red/orange/green/sparkled)");
    console.log("Example: node gunfit 1 Day orange");
}

var testInput = (process.argv.length > 2) ? process.argv[2] : undefined, test;

if(!checkTest())
    testInput = 1 + read.keyInSelect(tests.map((t) => `${t.testName}${t.active?" \x1b[32m[ACTIVE]\x1b[0m":""}`), "Test ");

if(!checkTest()) {
    const client = new Client(dblogin);
    client.connect();
    
    let startTime = new Date();
    
    client.query(`SELECT testName, count(testName) AS c FROM Fits GROUP BY testName ORDER BY c DESC`, (err, data) => {
        let endTime = new Date();
        if(err) {
            console.log(err);
            client.end();
            return;
        }
        
        let entries = data.rows;
        console.log(`Loaded in ${endTime.getTime() - startTime.getTime()}ms`);

        let longestTestName = entries.reduce((prev, current) => Math.max(prev, current.testname.length), "Test name".length);
        console.log("Test name".padEnd(longestTestName) + "  Count");
        console.log("-".padEnd(longestTestName, "-") + "-------"); 
        console.log(entries.map((t) => t.testname.padEnd(longestTestName) + "  " + t.c).join("\n"));
        client.end();
    })
    return;
}

const time = (process.argv.length > 3) ? process.argv[3] : ["day", "yasen"][read.keyInSelect(["Day", "Yasen"], "Time: ")];
if(["day", "yasen"].indexOf(time) < 0) {
    console.log("Invalid time!");
    return;
}
let morale = (process.argv.length > 4) ? process.argv[4] : ["red", "orange", "green", "sparkled"][read.keyInSelect(["Red", "Orange", "Green", "Sparkled"], "Morale: ")];
if(["red", "orange", "green", "sparkled"].indexOf(morale) < 0) {
    console.log("No morale, assuming any of test");
    morale = "any";
}

const checkNum = {
    red: [0, 28],
    orange: [29, 32],
    green: [33, 52],
    sparkled: [53, 100],
    any: [0, 100]
}[morale];
const checkMorale = (morale, checkNum) => morale >= checkNum[0] && morale <= checkNum[1];

console.log(`Looking up information of test #${1 + tests.indexOf(test)}: ${test.testName}...`);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM Fits WHERE testName = $1 ORDER BY id`, [test.testName], (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let cl = [0, 0, 0];
    
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    
    let equipAcc = test.equipment.reduce((a,b) => a + getEquipAcc(b), 0);
    let avgBaseAcc = 0;
    let testers = [], enemy = {};
    for(let entry of entries) {
        const shipMorale = entry.ship.morale
        if ((morale && !checkMorale(shipMorale, checkNum)) || time != entry.time) continue;
		if (!evas[entry.enemy]) continue;
		
        cl[entry.api_cl]++;
        enemy[entry.enemy] = (enemy[entry.enemy] || 0) + 1;
        const moraleMod = getMoraleMod(shipMorale);
        const spAttackMod = getSpAttackMod(time, entry.spAttackType);
        
        let lvl = entry.ship.lv, luck = entry.ship.luck;
        let baseAcc = Math.floor(((time == 'Day' ? 90 : 69) + 1.5 * Math.sqrt(luck) + 2 * Math.sqrt(lvl) + equipAcc) * moraleMod * spAttackMod);
        avgBaseAcc += baseAcc;

        let tester = testers.find((t) => t.id == entry.misc.id && t.name == entry.misc.username);
        if(tester == undefined) {
            tester = {
                "name": entry.misc.username,
                "id": entry.misc.id,
                "cl": [0,0,0],
                "luck": [luck, luck],
                "lvl": [lvl, lvl]
            }
            testers.push(tester);
        }
        tester.cl[entry.api_cl]++;
        tester.luck[0] = Math.min(tester.luck[0], luck);
        tester.luck[1] = Math.max(tester.luck[1], luck);
        tester.lvl[0] = Math.min(tester.lvl[0], lvl);
        tester.lvl[1] = Math.max(tester.lvl[1], lvl);
    }

    let samples = cl.reduce((a, b) => a + b), hit = cl[1] + cl[2];
    avgBaseAcc /= samples;

    let averageEvas = Object.keys(enemy).map((id) => evas[id] * enemy[id]).reduce((a, b) => a + b) / samples;
    
    let predictedAcc = (avgBaseAcc - averageEvas + 1) / 100;

    testers.sort((a, b) => a.cl.reduce((a,b) => a+b) - b.cl.reduce((a,b) => a+b));
    let topTesters = testers.slice(0, 10);

    console.log();
    console.log(`==== Contributors for this test ====`);
    console.log();
    console.log(topTesters.map((t, idx) => `${idx + 1}) ${t.name}: samples: ${t.cl.reduce((a,b) => a+b)}, CL0/CL1/CL2: ${t.cl.join("/")}, lck: ${range(t.luck)}, lvl: ${range(t.lvl)}, hit bounds: ${bounds(t.cl[1]+t.cl[2], t.cl.reduce((a,b) => a+b)).map(percentage).join(" ~ ")}`).join("\n"))
    console.log();
    console.log(`${testers.length} testers contributed`);
    console.log();
    console.log(`==== Accuracy summary of test ${test.testName}${!morale ? '' : ` in ${morale} morale`} ====`);
    console.log();
    console.log(`Base rate: ${avgBaseAcc}, avg. evas: ${averageEvas.toFixed(1)}, predicted rate: ${percentage(predictedAcc, 2)}`);
    console.log();
    console.log(`Found ${samples} samples, CL0/CL1/CL2: ${cl.join("/")}`);
    console.log(`Hit rate ${percentage(hit / samples)}, std. error ${percentage(error(hit/samples, samples))}`);
    console.log();
    console.log(`Bounds: ${bounds(hit, samples).map(percentage).join(" ~ ")}`);
    console.log(`Theoretical difference: ${percentage((hit / samples) - predictedAcc, 2)} (Error bounds: ${bounds(hit, samples).map((p) => percentage(p - predictedAcc, 1)).join(" ~ ")})`);
	client.end();
});
