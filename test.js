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

async function main() {
    
const client = new Client(dblogin);
console.log("connecting")
await client.connect();
console.log("connected")

let map = process.argv[2];
let startTime = new Date();
client.query(`SELECT * FROM enemycomp WHERE id > 41500000 AND map='49-3' AND node='40' AND difficulty=4 ORDER BY id DESC`, [], (err, data) => {
    let endTime = new Date();
    client.end();

    if(err) {
        console.log(err);
        return;
    }

    let entries = data.rows;
    console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
    console.log(entries.map(k => k.datetime))
    for (const e of entries) {
        if (e.enemycomp.ship[0] != 1981)
            console.log(entries[0].enemycomp)
    }
    //console.log(entries[0].enemycomp)
});

}
main().catch(console.error)