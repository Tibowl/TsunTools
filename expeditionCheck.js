const fs = require('fs'),
    { Client } = require('pg'),
    Utils = require("./Utils")
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
const shipdata = require(`${global.currentDir}/damage/kcSHIPDATA.js`)['shipdata'];
const eqdata = require(`${global.currentDir}/damage/kcEQDATA.js`)['EQDATA'];

const expeditions = require("./config/exped.json")
const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const expedIdFilter = process.argv.length > 2 ? +process.argv[2] : 0
const limit = process.argv.length > 3 ? +process.argv[3] : 1000

const client = new Client(dblogin);
client.connect();

const toInt = (id) => {
    if (id.match(/[A-B]\d/))
        return (id.charCodeAt(0) - 65) * 10 + 99 + parseInt(id[1])
    if (id.match(/[D]\d/))
        return (id.charCodeAt(0) - 65) * 10 + 100 + parseInt(id[1])
    // A1 = 100; A2 = 101 ... B1 = 110, ... B4 = 114, D1 = 131, are you serious?
    return parseInt(id)
}

const stype = [
    "", "DE", "DD", "CL", "CLT", "CA", "CAV", "CVL", "FBB", "BB", "BBV", "CV", "XBB", "SS", "SSV", "AP", "AV", "LHA", "CVB", "AR", "AS", "CT", "AO"
]
/**
 * Based on 
 * https://github.com/Nishisonic/SuccessCheck/blob/master/util_missioncheck.js
 * @param {Integer} exped Expedition api ID
 * @param {Array} fleet List of ships in fleet
 */
const getExpected = (exped, fleet) => {
    const { 
        totalLv, flagshipLv, flagshipStype, shipNum,
        DE, DD, CL, CV, CVL, ACV, AV, CA, SS, CVS, CVB, AS, CVE, TV,
        AA, ASW, LOS, firePower, 
        drumShips, drum 
    } = getStats(fleet);
    const hasFleetEscortForce = CL >= 1 && (DD + DE) >= 2 || DD >= 1 && DE >= 3 || TV >= 1 && DE >= 2 || CVE >= 1 && DE >= 2 || CVE >= 1 && DD >= 2;

    // Refueled?
    if (fleet.find(k => k.ammo[0] < k.ammo[1] || k.fuel[0] < k.fuel[1])) return false

    switch (exped) {
        case 1: // 練習航海
            return shipNum >= 2
        case 2: // 長距離練習航海
            return flagshipLv >= 2 && shipNum >= 4
        case 3: // 警備任務
            return flagshipLv >= 3 && shipNum >= 3
        case 4: // 対潜警戒任務
            return flagshipLv >= 3 && shipNum >= 3 && hasFleetEscortForce
        case 5: // 海上護衛任務
            return flagshipLv >= 3 && shipNum >= 4 && hasFleetEscortForce
        case 6: // 防空射撃演習
            return flagshipLv >= 4 && shipNum >= 4 // Edited, lv 5 -> 4
        case 7: // 観艦式予行
            return flagshipLv >= 5 && shipNum >= 6
        case 8: // 観艦式
            return flagshipLv >= 6 && shipNum >= 6
        case 100: // 兵站強化任務
            return flagshipLv >= 5 && shipNum >= 4 && (DE + DD) >= 3
        case 101: // 海峡警備行動
            return flagshipLv >= 20 && shipNum >= 4 && (DE + DD) >= 4 && (AA >= 70 && ASW >= 180) && totalLv >= 110
        case 102: // 長時間対潜警戒
            return flagshipLv >= 35 && shipNum >= 5 && (CL >= 1 && (DE + DD) >= 3 || hasFleetEscortForce) && (AA >= 90 && ASW >= 280 && LOS >= 60) && totalLv >= 107
        case 103: // 南西方面連絡線哨戒
            return flagshipLv >= 40 && shipNum >= 5 && (CL >= 1 && (DE + DD) >= 2 || hasFleetEscortForce) && (firePower >= 300 && AA >= 200 && ASW >= 200 && LOS >= 120) && totalLv >= 200
        case 9: // タンカー護衛任務
            return flagshipLv >= 3 && shipNum >= 4 && hasFleetEscortForce
        case 10: // 強行偵察任務
            return flagshipLv >= 3 && shipNum >= 3 && CL >= 2
        case 11: // ボーキサイト輸送任務
            return flagshipLv >= 6 && shipNum >= 4 && (DE + DD) >= 2
        case 12: // 資源輸送任務
            return flagshipLv >= 4 && shipNum >= 4 && (DE + DD) >= 2
        case 13: // 鼠輸送作戦
            return flagshipLv >= 5 && shipNum >= 6 && (CL >= 1 && DD >= 4)
        case 14: // 包囲陸戦隊撤収作戦
            return flagshipLv >= 6 && shipNum >= 6 && (CL >= 1 && DD >= 3)
        case 15: // 囮機動部隊支援作戦
            return flagshipLv >= 6 && shipNum >= 6 && ((CV + CVL + ACV + AV) >= 2 && DD >= 2)
        case 16: // 艦隊決戦援護作戦
            return flagshipLv >= 10 && shipNum >= 6 && (CL >= 1 && DD >= 2)
        case 110: // 南西方面航空偵察作戦
            return flagshipLv >= 40 && shipNum >= 6 && (AV >= 1 && CL >= 1 && (DE + DD) >= 2) && (AA >= 200 && ASW >= 200 && LOS >= 140) && totalLv >= 150
        case 111: // 敵泊地強襲反撃作戦
            return flagshipLv >= 45 && shipNum >= 6 && (CA >= 1 && CL >= 1 && DD >= 3) && (firePower >= 360 && LOS >= 140) && totalLv >= 220
        case 112: // 南西諸島離島哨戒作戦
            return flagshipLv >= 50 && shipNum >= 6 && (AV >= 1 && CL >= 1 && DD >= 4) && (firePower >= 400 && ASW >= 220 && LOS >= 190) && totalLv >= 270
        case 113: // 南西諸島離島防衛作戦
            return flagshipLv >= 55 && shipNum >= 6 && (CA >= 2 && CL >= 1 && DD >= 2 && (SS + CVS) >= 1) && (firePower >= 500 && ASW >= 280) && totalLv >= 450
        case 17: // 敵地偵察作戦
            return flagshipLv >= 20 && shipNum >= 6 && (CL >= 1 && DD >= 3)
        case 18: // 航空機輸送作戦
            return flagshipLv >= 15 && shipNum >= 6 && ((CV + CVL + ACV + AV) >= 3 && DD >= 2)
        case 19: // 北号作戦
            return flagshipLv >= 20 && shipNum >= 6 && (CVB >= 2 && DD >= 2)
        case 20: // 潜水艦哨戒任務
            return shipNum >= 2 && ((SS + CVS) >= 1 && CL >= 1)
        case 21: // 北方鼠輸送作戦
            return flagshipLv >= 15 && shipNum >= 5 && (CL >= 1 && DD >= 4) && totalLv >= 30 && drumShips >= 3
        case 22: // 艦隊演習
            return flagshipLv >= 30 && shipNum >= 6 && (CA >= 1 && CL >= 1 && DD >= 2) && totalLv >= 45
        case 23: // 航空戦艦運用演習
            return flagshipLv >= 50 && shipNum >= 6 && (CVB >= 2 && DD >= 2) && totalLv >= 200
        case 24: // 北方航路海上護衛
            return flagshipLv >= 50 && shipNum >= 6 && (flagshipStype === stype[3] && (DE + DD) >= 4) && totalLv >= 200
        case 25: // 通商破壊作戦
            return flagshipLv >= 25 && shipNum >= 4 && (CA >= 2 && DD >= 2)
        case 26: // 敵母港空襲作戦
            return flagshipLv >= 30 && shipNum >= 4 && ((CV + CVL + ACV + AV) >= 1 && CL >= 1 && DD >= 2)
        case 27: // 潜水艦通商破壊作戦
            return shipNum >= 2 && (SS + CVS) >= 2
        case 28: // 西方海域封鎖作戦
            return flagshipLv >= 30 && shipNum >= 3 && (SS + CVS) >= 3
        case 29: // 潜水艦派遣演習
            return flagshipLv >= 50 && shipNum >= 3 && (SS + CVS) >= 3
        case 30: // 潜水艦派遣作戦
            return flagshipLv >= 55 && shipNum >= 4 && (SS + CVS) >= 4
        case 31: // 海外艦との接触
            return flagshipLv >= 60 && shipNum >= 4 && (SS + CVS) >= 4 && totalLv >= 200
        case 32: // 遠洋練習航海
            return flagshipLv >= 5 && shipNum >= 3 && (flagshipStype === stype[21] && DD >= 2)
        case 33: // 前衛支援任務
            return shipNum >= 2 && DD >= 2
        case 34: // 艦隊決戦支援任務
            return shipNum >= 2 && DD >= 2
        case 35: // MO作戦
            return flagshipLv >= 40 && shipNum >= 6 && ((CV + CVL + ACV + AV) >= 2 && CA >= 1 && DD >= 1)
        case 36: // 水上機基地建設
            return flagshipLv >= 30 && shipNum >= 6 && (AV >= 2 && CL >= 1 && DD >= 1)
        case 37: // 東京急行
            return flagshipLv >= 50 && shipNum >= 6 && (CL >= 1 && DD >= 5) && totalLv >= 200 && (drumShips >= 3 && drum >= 4)
        case 38: // 東京急行(弐)
            return flagshipLv >= 65 && shipNum >= 6 && DD >= 5 && totalLv >= 240 && (drumShips >= 4 && drum >= 8)
        case 39: // 遠洋潜水艦作戦
            return flagshipLv >= 3 && shipNum >= 5 && (AS >= 1 && (SS + CVS) >= 4) && totalLv >= 180
        case 40: // 水上機前線輸送
            return flagshipLv >= 25 && shipNum >= 6 && (flagshipStype === stype[3] && AV >= 2 && DD >= 2) && totalLv >= 150
        case 41: // ブルネイ泊地沖哨戒
            return flagshipLv >= 30 && shipNum >= 3 && (DE + DD) >= 3 && (firePower >= 60 && AA >= 80 && ASW >= 210) && totalLv >= 100
        case 42: // ミ船団護衛(一号船団)
            return flagshipLv >= 45 && shipNum >= 4 && (CL >= 1 && (DE + DD) >= 2 || hasFleetEscortForce) && totalLv >= 200
        case 43: // ミ船団護衛(二号船団)
            return flagshipLv >= 55 && shipNum >= 6 && (((flagshipStype === stype[7] && shipdata[fleet[0].id].ASW > 0) && (DE + DD) >= 2) || (flagshipStype === stype[7] && CL === 1 && DD >= 4)) && (firePower >= 500 && ASW >= 280) && totalLv >= 464
        case 44: // 航空装備輸送任務
            return flagshipLv >= 35 && shipNum >= 6 && ((CV + CVL + ACV) >= 2 && AV >= 1 && CL >= 1 && DD >= 2) && ASW >= 200 && (drumShips >= 3 && drum >= 6) && totalLv >= 216
        default:
            return undefined
    }
}

let startTime = new Date();
console.log(`Expedition ID filter: ${expedIdFilter}`)
client.query(`SELECT * FROM expedition WHERE expedid > 0 ${expedIdFilter ? `AND expedid = ${expedIdFilter}` : ""} ORDER by ID DESC LIMIT ${limit}`, [], (err, data) => {
    let endTime = new Date();
    client.end();
    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)

    let minStats = undefined
    const resultCount = [0, 0, 0]
    const errorMatrix = [[0,0],[0,0]]

    aloop: for (let row of entries) {
        const {expedid, fleet, hqxp, items, resources, result, shipxp} = row
        if(shipxp[0] == 0) continue; // Cancelled
        resultCount[result]++
        
        for(const ship of fleet) {
            if(!shipdata[ship.id]) {
                console.warn("Unknown ship " + ship.id);
                continue aloop;
            }
            for(const equip of ship.equips) {
                if(equip > 0 && !eqdata[equip]) {
                    console.warn("Unknown equip " + equip);
                    continue aloop;
                }
            }
        }

        const exped = expeditions.find(k => toInt(k.id) == expedid) || undefined
        if(exped == undefined) {
            console.log("Unknown exped", expedid)
            continue
        }

        const expected = getExpected(expedid, fleet)
        errorMatrix[result <= 0 ? 0 : 1][expected ? 1 : 0]++
        if(result <= 0 && !expected)
            continue // Failed expedition
        else if (result <= 0) {
            console.log(`ID: ${row.id} - Exped: ${expedid}/${exped.id}: Failed while expected succeed!`)
            // console.log(fleet)
            console.log(getStats(fleet))
            continue
        } else if(result >= 0 && !expected) {
            console.log(`ID: ${row.id} - Exped: ${expedid}/${exped.id}: Succeeded while expected fail!`)
            // console.log(getStats(fleet))
            console.log(getStats(fleet))
        }
        
        if(!minStats) {
            minStats = getStats(fleet)
            minStats.flagshipStype = [minStats.flagshipStype]
        } else {
            const fleetStats = getStats(fleet)
            Object.keys(minStats).forEach(key => {
                if(key == "flagshipStype") {
                    if(!minStats[key].includes(fleetStats[key]))
                        minStats[key].push(fleetStats[key])
                } else
                    minStats[key] = Math.min(minStats[key], fleetStats[key])
            })
        }
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
        const tokuCap = [
            [0,     0,     0,     0,     0],
            [0.020, 0.020, 0.020, 0.020, 0.020],
            [0.040, 0.040, 0.040, 0.040, 0.040],
            [0.050, 0.050, 0.052, 0.054, 0.054],
            [0.054, 0.056, 0.058, 0.059, 0.060]][Math.min(tokuCount, 4)][Math.min(normalCount, 4)];
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
    console.log(`Failed/Normal/GS: ${resultCount.join("/")}`)
    console.log(`Error matrix:`)
    console.log(Utils.createTable(
        ["", "Fail", "Success"],
        [["Fail", ...errorMatrix[0]], ["Success", ...errorMatrix[1]]]
    ))
    if(expedIdFilter > 0) console.log(minStats)
});
function getStats(fleet) {
    const filter = (id) => fleet.filter(ship => {
        const data = shipdata[ship.id]
        return data.type == stype[id]
    })
    const addImprovements = (ship, item, kind) => {
        const type2 = eqdata[item[0]].type
        let stars = ship.improvements[item[1]]
        if(stars == -1) stars = 0;
    
        let modifier = 0;
        switch (kind) {
            // https://github.com/KC3Kai/KC3Kai/blob/master/src/library/objects/Gear.js
            case "LOS":
                switch (type2) {
                    case 12: // Small radar
                        modifier = 1.25;
                        break;
                    case 13: // Large radar
                        modifier = 1.4;
                        break;
                    case 9: // Recon plane
                    case 10: // Seaplane recon
                    case 49: // LB Recon
                    case 59: // Jet Recon
                    case 94: // Recon (II)
                        modifier = 1.2;
                        break;
                    case 11: // Seaplane bomber
                        modifier = 1.15;
                        break;
                }
                return modifier * Math.sqrt(stars);
            case "AA":
                switch (type2) {
                    case 6: // carrier-based fighter
                        modifier = 0.2;
                        break;
                    case 7: // fighter bomber (dive bomber with AA stat)
                    case 57: // jet bomber
                        modifier = 0.25;
                        break;
                    case 45: // seaplane fighter
                        // seaplane bomber no AA bonus found yet, but found DV & LoS bonus
                        modifier = 0.2;
                        break;
                    case 48: // LB fighter or LB interceptor
                        modifier = 0.2;
                        break;
                }
                return modifier * stars;
            case "FP":
                switch (type2) {
                    case 1: // Small Cal. Main
                    case 101: // Small Cal. Main
                        modifier = 0.5;
                        break;
                    case 2: // Medium Cal. Main
                    case 18: // Type 3 Shell
                    case 19: // AP Shell
                    case 21: // AA Machine Gun
                    case 29: // Searchlight
                    case 42: // Large Searchlight
                    case 36: // AA Fire Director
                    case 37: // Anti-Ground Rocket
                    case 3: // Large Cal. Main
                        modifier = 1;
                        break;

                    case 104: // Custom type
                        return 0.2 * stars;
                    case 4: // Secondary
                        // 0.2 per star for green HA guns,
                        // 0.3 per star for yellow guns,
                        // modifier = this.master().api_type[3] === 16 ? 0.2 : 0.3;
                        // return modifier * stars;
                        return 0.3 * stars;

                    case 8: // Torpedo Bomber
                    case 58: // Jet Torpedo Bomber
                        return 0.2 * stars;
                    case 14: // Sonar
                    case 40: // Large Sonar
                        modifier = 0.75;
                        break;
                    case 15: // Depth Charge (Projector)
                        modifier = (type2 == 15 && [226, 227].indexOf(item[0]) > -1) ? 0 : 0.75;
                        break;
                }
                return modifier * Math.sqrt(stars);

            default:
                return 0;
        }
    }
    const toTotalValue = (shipkind, equipkind, e = []) => 
        Math.floor(fleet.map((ship) => ship.stats[shipkind]
            + ship.equips.map((item, ind) => [item, ind])
                         .filter(item => item[0] > 0)
                         // .filter((item) => e.indexOf(eqdata[item[0]].type) < 0)
                         .map((item) => (eqdata[item[0]][equipkind] || 0) + addImprovements(ship, item, equipkind)) // TODO improvements
                         .reduce((previous, current) => previous + current, 0)
        ).reduce((previous, current) => previous + current, 0))
    
    const DE  = filter(1).length,  DD  = filter(2).length,  CL  = filter(3).length,  CA = filter(5).length, 
          CVL = filter(7).length,  CVB = filter(10).length, CV  = filter(11).length, SS = filter(13).length, 
          CVS = filter(14).length, AV  = filter(16).length, ACV = filter(18).length, AS = filter(20).length, 
          TV  = filter(21).length;
    const CVE = filter(7).filter(ship => {
        const data = shipdata[ship.id];
        return data.ASW > 0;
    }).length
    const flagship = fleet[0], flagshipLv = flagship.lvl, flagshipStype = shipdata[flagship.id].type;
    const totalLv = fleet.map(k => k.lvl).reduce((a, b) => a + b);
    const firePower = toTotalValue("fp", "FP"), AA = toTotalValue("aa", "AA", [10, 11, 41]), ASW = toTotalValue("as", "ASW", [10, 11, 41]), LOS = toTotalValue("ls", "LOS", [10, 11, 41]), drumShips = fleet.filter(ship => ship.equips.find(k => k == 75)).length, drum = fleet.map(ship => ship.equips.filter(k => k == 75).length).reduce((a, b) => a + b);
    const shipNum = fleet.length
    return {
        totalLv, flagshipLv, flagshipStype, shipNum,
        DE, DD, CL, CV, CVL, ACV, AV, CA, SS, CVS, CVB, AS, CVE, TV,
        AA, ASW, LOS, firePower, 
        drumShips, drum 
    };
}

