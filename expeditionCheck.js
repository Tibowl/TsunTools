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
if (!fs.existsSync(`${global.currentDir}/config/exped.json`)) {
    console.error(`Missing expedition data, 'config/exped.json', grab them from `);
    return;
}

const expeditions = require("./config/exped.json")
const dblogin = require(`${global.currentDir}/config/dblogin.json`);

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT * FROM expedition WHERE expedid > 0 ORDER by ID`, [], (err, data) => {
    let endTime = new Date();
    client.end();
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)

    for (let row of entries) {
        const {expedid, fleet, hqxp, items, resources, result, shipxp} = row

        if(result <= 0)
            continue // Failed expedition

        const toInt = (id) => {
            if(id.match(/[A-Z]\d/))
                return (id.charCodeAt(0) - 65) * 10 + 99 + parseInt(id[1])
            return parseInt(id)
        }

        const exped = expeditions.find(k => toInt(k.id) == expedid) || {}

        const isGs = result == 2

        let improveCount = 0
        let normalCount = 0, t89Count = 0, t2Count = 0, tokuCount = 0
        let bonusShipCount = 0

        const addImprove = (k) => k > 0 ? improveCount += k : 0
        for (const ship of fleet) {
            if(ship.id == 487)                  // Kinu k2
                bonusShipCount += 1

            ship.equips.forEach((equipId, ind) => {
                if (equipId <= 0)
                    return;
                if (equipId === 68) {           // normal landing craft
                    normalCount += 1;
                    addImprove(ship.improvements[ind]);
                } else if (equipId === 166) {   // T89
                    t89Count += 1;
                    addImprove(ship.improvements[ind]);
                } else if (equipId === 167) {   // T2
                    t2Count += 1;
                    addImprove(ship.improvements[ind]);
                } else if (equipId === 193) {   // toku landing craft (230: +11th tank no count)
                    tokuCount += 1;
                    addImprove(ship.improvements[ind]);
                }
            })
        }
        const basicBonus = (normalCount + tokuCount + bonusShipCount) * 0.05 + t89Count * 0.02 + t2Count * 0.01;
        const cappedBasicBonus = Math.min(0.2, basicBonus);
        const tokuCap = (tokuCount) <= 3 ? 0.05 : 0.054;
        const tokuBonus = Math.min(tokuCap, 0.02 * tokuCount);
        const landingCraftCount = normalCount + t89Count + t2Count + tokuCount
        const improveBonus = landingCraftCount > 0 ? 0.01 * improveCount * cappedBasicBonus / landingCraftCount : 0.0;

        const expectedResources = (exped.rsc || [0, 0, 0, 0]).map(rsc =>  {
            const actualBase = Math.floor( rsc * (isGs ? 1.5 : 1))
            const bonus1 = Math.floor( rsc * (isGs ? 1.5 : 1) * (cappedBasicBonus + improveBonus) );
            const bonus2 = Math.floor( rsc * (isGs ? 1.5 : 1) * tokuBonus );
            return actualBase + bonus1 + bonus2
        })

        if(!expectedResources.every((v, i) => v == resources[i]))
            console.log(`Toku: ${tokuCount}, Normal: ${normalCount}, T89: ${t89Count}, T2: ${t2Count}, improv ${improveCount}, Kinu: ${bonusShipCount} GS: ${isGs} - ID: ${row.id} - Exped: ${expedid}: ${expectedResources.join(",")} -> ${resources.join(",")}`)
    }
});
