const fs = require('fs'),
    { Client } = require('pg')

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

client.query(`SELECT * FROM abnormaldamage WHERE (enemy->>'id')::int = ANY('{1637,1638,1639,1640}') ORDER BY id`, (err, data) => {
    if(err) {
        console.log(err);
        client.end();
        return;
    }
    let entries = data.rows;
    console.log(`Found ${entries.length} entries`);

    fs.writeFile('PTsd.json', JSON.stringify(entries), 'utf8', function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("Entries saved!");
    });
    client.end();
});

