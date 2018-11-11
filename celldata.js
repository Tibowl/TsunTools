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

if(process.argv.length <= 2) {
    console.log("Usage: node celldata <map>");
    return;
}

const client = new Client(dblogin);
client.connect();

let map = process.argv[2];
let startTime = new Date();
client.query(`SELECT * FROM celldata WHERE map=$1 ORDER BY amountofnodes DESC LIMIT 1`, [map], (err, data) => {
    let celldata = data.rows[0].celldata;
    client.query(`SELECT map, edgeid[array_length(edgeid, 1)] as edge, (nodeinfo->>'nodeColor')::int as nodeColor, (nodeinfo->>'eventKind')::int as eventKind, (nodeinfo->>'eventId')::int as eventId FROM eventworld WHERE map=$1 GROUP BY map, edgeid[array_length(edgeid, 1)], nodeinfo->>'nodeColor', nodeinfo->>'eventKind', nodeinfo->>'eventId'`, [map], (err, data) => {
        let endTime = new Date();
        client.end();
        if(err) {
            console.log(err);
            client.end();
            return;
        }
        let entries = data.rows;
        console.log(`${entries.length} entries loaded in ${endTime.getTime() - startTime.getTime()}ms`)
        for (let row of entries) {
            row = Object.assign({}, row);
            console.log(row);
            row.originalcolor = row.nodecolor;
            if(row.originalcolor == 4 && row.eventid == 6) row.nodecolor = 1;
            if(row.originalcolor == 4 && row.eventid == 6 && row.eventkind == 2) row.nodecolor = -99;
            if(row.edge == 6)
            console.log(row.edge, "->", row.originalcolor, row.eventid, row.eventkind, "->", row.nodecolor);
            if(!celldata[row.edge]) celldata[row.edge] = {api_no: row.edge};
            celldata[row.edge].tsundb_color = row.nodecolor;
        }
        for(let edge of celldata)
            if(edge.api_color_no)
                edge.api_color_no = -1;
        console.log('svdata='+JSON.stringify({api_data:{
            api_maparea_id: map.split('-')[0],
            api_mapinfo_no: map.split('-')[1],
            api_cell_data: celldata
        }},0,4));
    });
});
