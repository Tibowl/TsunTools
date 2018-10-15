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

client.query(`SELECT * FROM enemycomp WHERE airbattle IS NOT NULL AND (airbattle->>'landBase')::boolean = true AND (airbattle->>'bakFlag')::boolean 
    IS NOT NULL ORDER BY id`, (err, data) => {
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`Found ${entries.length} entries`);

    fs.writeFile('AB.json', JSON.stringify(entries), 'utf8', function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("Entries saved!");
    });
    client.end();
});

