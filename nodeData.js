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

const client = new Client(dblogin);
client.connect();

let startTime = new Date();
let mapdata = {}
for(let map of ['1-1','1-2','1-3','1-4','1-5','1-6',
'2-1','2-2','2-3','2-4','2-5',
'3-1','3-2','3-3','3-4','3-5',
'4-1','4-2','4-3','4-4','4-5',
'5-1','5-2','5-3','5-4','5-5',
'6-1','6-2','6-3','6-4','6-5',
'7-1','7-2',
'42-1','42-2','42-3','42-4','42-5',
'43-1','43-2','43-3',
'44-1','44-2','44-3','44-4','44-5'])
client.query(`SELECT * FROM celldata WHERE map=$1 ORDER BY amountofnodes DESC LIMIT 1`, [map], (err, data) => {
    let celldata = data.rows[0].celldata;
    if(err) {
        console.log(err);
        return;
    }
    console.log(map);
    mapdata[map] = celldata;
    fs.writeFileSync("./celldata.json", JSON.stringify(mapdata))
});
