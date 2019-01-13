const fs = require('fs'),
    { Client } = require('pg');

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

if (!fs.existsSync(`${global.currentDir}/config/edges.json`)) {
    console.error(`Missing config/edges.json, grab them from:
https://github.com/KC3Kai/KC3Kai/blob/update-cumulative/src/data/edges.json`);
    return;
}

if (!fs.existsSync(`${global.currentDir}/config/idTL.json`)) {
    console.error(`Missing config/idTL.json, you can generate them with KC3 by executing:
let tls = {"equip":{}, "ships":{}};
Object.values(KC3Master.all_ships()).filter((s) => s.api_id < 700).forEach((s) => {tls.ships[s.api_id] = { "jp": KC3Master.ship(s.api_id).api_name, "en": KC3Meta.shipName(KC3Master.ship(s.api_id).api_name)}});
Object.values(KC3Master.all_slotitems()).forEach((s) => {tls.equip[s.api_id] = { "jp": KC3Master.slotitem(s.api_id).api_name, "en": KC3Meta.gearName(KC3Master.slotitem(s.api_id).api_name)}});
copy(JSON.stringify(tls,0,4));`);
    return;
}

const dblogin = require(`${global.currentDir}/config/dblogin.json`);
const edges = require(`${global.currentDir}/config/edges.json`);
const idTL = require(`${global.currentDir}/config/idTL.json`);

const range = r => {
    if(r[0] == r[1]) return r[0] + "";
    return r.join(" ~ ");
}
var resource = [6657, 5699, 3371, 8909, 7719, 6229, 5449, 8561, 2987, 5501, 3127, 9319, 4365, 9811, 9927, 2423, 3439, 1865, 5925, 4409, 5509, 1517, 9695, 9255, 5325, 3691, 5519, 6949, 5607, 9539, 4133, 7795, 5465, 2659, 6381, 6875, 4019, 9195, 5645, 2887, 1213, 1815, 8671, 3015, 3147, 2991, 7977, 7045, 1619, 7909, 4451, 6573, 4545, 8251, 5983, 2849, 7249, 7449, 9477, 5963, 2711, 9019, 7375, 2201, 5631, 4893, 7653, 3719, 8819, 5839, 1853, 9843, 9119, 7023, 5681, 2345, 9873, 6349, 9315, 3795, 9737, 4633, 4173, 7549, 7171, 6147, 4723, 5039, 2723, 7815, 6201, 5999, 5339, 4431, 2911, 4435, 3611, 4423, 9517, 3243]
const key = s => s.split('').reduce((a, e) => a + e.charCodeAt(0), 0)
const create = (id, type) =>
  (17 * (id + 7) * resource[(key(type) + id * type.length) % 100] % 8973 + 1000).toString()
const pad = (id, eors) => eors == 'ship' ? (id < 10 ? `000${id}` : id < 100 ? `00${id}` : id < 1000 ? `0${id}` : id.toString()) : (id < 10 ? `00${id}` : id < 100 ? `0${id}` : id.toString())
const getPath = (id, eors, type, ext) => {
  let suffix = "";
  return `/kcs2/resources/${eors}/${type}/${pad(id, eors)}${suffix}_${create(id, `${eors}_${type}`)}.${ext}`
}

if(process.argv.length <= 2) {
    console.log("Quick usage: node friendfleet <area ID>");
    console.log("Example: node friendfleet 43");
    return;
}

var area = process.argv[2];

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
client.query(`SELECT DISTINCT map, node, variation, fleet::text, uniquekey FROM friendlyfleet WHERE map LIKE '${area}-%'`, (err, data) => {
    let endTime = new Date();
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    
    let entries = data.rows;
    console.log(`${entries.length} samples loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    
    let friendFleets = [];

    for (let entry of entries) {
        // Node/map
        let node = edges["World " + entry.map][entry.node][1];
        let map  = `${entry.map} ${node}`

        // Grouping
        let fleet = JSON.parse(entry.fleet);
        let uniqueness = JSON.stringify({"ship": fleet.ship, "equip": fleet.equip});
        
        let foundFleet = friendFleets.find((a) => a.uniqueness === uniqueness);

        if(foundFleet) {
            if (foundFleet.maps.indexOf(map) < 0)
                foundFleet.maps.push(map);
            foundFleet.nowhp = foundFleet.nowhp.map((val, ind) => [Math.min(val[0], fleet.nowhp[ind]), Math.max(val[1], fleet.nowhp[ind])])
            foundFleet.lvl = foundFleet.lvl.map((val, ind) => [Math.min(val[0], fleet.lvl[ind]), Math.max(val[1], fleet.lvl[ind])])
            foundFleet.stats = foundFleet.stats.map((sh, ind) => sh.map((val, inx) => [Math.min(val[0], fleet.stats[ind][inx]), Math.max(val[1], fleet.stats[ind][inx])]))
            foundFleet.maps = foundFleet.maps.sort();
        } else {
            fleet.uniqueness = uniqueness;
            fleet.maps = [map];
            fleet.nowhp = fleet.nowhp.map((a) => [a,a]);
            fleet.lvl = fleet.lvl.map((a) => [a,a]);
            fleet.stats = fleet.stats.map((b) => b.map((a) => [a,a]));
            friendFleets.push(fleet);
        }
    }

    console.log(`Found ${friendFleets.length} fleets.`)

    let knownUniq =  [/*
        `{"ship":[136,321,369,490],"equip":[[276,276,276,140,-1],[235,235,275,101,-1],[266,286,88,-1,-1],[286,286,286,-1,-1]]}`,
        `{"ship":[349,301,542,563],"equip":[[267,286,88,-1,-1],[266,286,88,-1,-1],[267,286,240,-1,-1],[286,286,286,-1,-1]]}`,
        `{"ship":[349,301,542,563],"equip":[[267,286,88,-1,-1],[266,266,74,-1,-1],[267,267,101,-1,-1],[267,286,240,-1,-1]]}`,
        `{"ship":[536,383,386,373],"equip":[[154,255,259,-1,-1],[229,229,88,-1,-1],[229,229,88,-1,-1],[267,286,88,-1,-1]]}`,
        `{"ship":[536,383,386],"equip":[[154,255,259,-1,-1],[229,229,88,-1,-1],[229,229,88,-1,-1]]}`,
        `{"ship":[687,327,328],"equip":[[266,266,74,-1,-1],[266,266,101,-1,-1],[266,15,88,-1,-1]]}`,
        `{"ship":[687,498],"equip":[[266,266,101,-1,-1],[266,286,88,-1,-1]]}`,
        `{"ship":[557,354,355,586],"equip":[[122,286,88,-1,-1],[266,286,88,-1,-1],[266,286,88,-1,-1],[309,309,309,101,-1]]}`,
        `{"ship":[373,688,680],"equip":[[267,15,88,-1,-1],[267,15,88,-1,-1],[286,286,286,-1,-1]]},`,
        `{"ship":[686,359],"equip":[[267,267,101,-1,-1],[286,15,286,-1,-1]]}`,
        `{"ship":[373,688,680],"equip":[[267,15,88,-1,-1],[267,15,88,-1,-1],[286,286,286,-1,-1]]}`,
        `{"ship":[688,373],"equip":[[267,286,88,-1,-1],[286,286,286,-1,-1]]}`,
        `{"ship":[330,329,294,690],"equip":[[122,122,74,-1,-1],[266,286,88,-1,-1],[266,286,88,-1,-1],[310,310,101,-1,-1]]}`,
        `{"ship":[373,680,688],"equip":[[267,286,88,-1,-1],[267,286,88,-1,-1],[286,286,286,-1,-1]]}`,
        `{"ship":[150,152,323,144],"equip":[[7,7,7,74,-1],[7,7,7,101,-1],[266,266,15,-1,-1],[15,15,15,-1,-1]]}`,
        `{"ship":[208,195],"equip":[[63,63,101,-1,-1],[285,285,285,-1,-1]]}`,
        `{"ship":[498,687],"equip":[[266,286,88,-1,-1],[286,286,286,-1,-1]]}`*/
    ]
    friendFleets = friendFleets.filter((a) => knownUniq.indexOf(a.uniqueness) < 0)

    let count = (a) => a.ship.length + a.equip.map((a) => a.filter((b) => b>0).length).reduce((a,b) => a+b,0)
    friendFleets = friendFleets.sort((a, b) => (a.maps[0].localeCompare(b.maps[0])) || (a.ship[0] - b.ship[0]) || (count(b) - count(a)))
    let previousMaps = undefined;
    let fleetHTML = ``;
    let c = 0;
    for (let friendfleet of friendFleets) {
        console.log(friendfleet.uniqueness)
        let maplist = friendfleet.maps.sort().join(", ");
        if (previousMaps == undefined)
            previousMaps = maplist;
        if (previousMaps != maplist) {
            previousMaps = maplist;
            if (c % 3 != 0) 
                fleetHTML += `<div style="clear: both; height: 5px;"></div>`
            fleetHTML += `<div style="clear: both; height: 10px;"></div>
            <hr>
            <div style="clear: both; height: 10px;"></div>
            `
            c = 0;
        }
        fleetHTML += `
<table border=1 rules=rows>
    <col width="130px">
    <col width="50px">
    <col width="100px">
    <col width="300px">
        
    <tr>
        <th colspan="4">Map: ${maplist}</th>
    </tr>
`
        for (let ind in friendfleet.ship) {
            let shipId = friendfleet.ship[ind];
            let equip = friendfleet.equip[ind].filter((a) => a>0);
            fleetHTML += `
    <tr>
        <td>
            <img width="130px" src="http://203.104.209.23/${getPath(shipId, "ship", "banner", "png")}">
        </td>
        <td style="background-color:#cfc">
            Lv. ${range(friendfleet.lvl[ind])}
        </td>
        <td style="background-color:#fcc">
            <img src="https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/stats/hp.png"> ${range(friendfleet.nowhp[ind])}/${friendfleet.hp[ind]}
        </td>
        <td style="background-color:#ccf">
            <img src="https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/stats/fp.png">
            ${range(friendfleet.stats[ind][0])}
            <img src="https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/stats/tp.png">
            ${range(friendfleet.stats[ind][1])}
            <img src="https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/stats/aa.png">
            ${range(friendfleet.stats[ind][2])}
            <img src="https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/stats/ar.png">
            ${range(friendfleet.stats[ind][3])}
        </td>
    </tr>
    <tr>
        <td style="vertical-align: top" rowspan="${equip.length}">${idTL.ships[shipId].jp}<br>${idTL.ships[shipId].en}</td>`
            let first = true;
            for (let e of equip) {
                fleetHTML += `
${first ? `` : `    <tr>
`}        <td><img height="40px" src="http://203.104.209.23/${getPath(e, "slot", "card", "png")}"></td> 
        <td style="vertical-align: top" colspan="2">${idTL.equip[e].jp}<br>${idTL.equip[e].en}</td>
    </tr>`
            }

        } 
        fleetHTML += `
</table>
`
        if(++c % 3 == 0)
            fleetHTML += `<div style="clear: both; height: 5px;"></div>`
    }

    let finalHTML = `
<html>
    <head>
        <style>
        table {
            float: left;
            margin-right: 1px;
        }
        th, td {
            /*border: 1px solid black;*/
            margin: 0px;
        }
        </style>
    </head>
    <body>
    ${fleetHTML}
    </body>
</html>`
    fs.writeFile('friendfleet.html', finalHTML, 'utf8', function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("File saved!");
    });

	client.end();
});
