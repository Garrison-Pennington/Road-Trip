
const http = require('http');
const fs = require('fs');
const connect = require('connect');
const serveStatic = require('serve-static');
const mysql      = require('mysql');
const express    = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) => res.send('Hello World!'));
app.post('/', (req, res) => res.send('POST malone'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
app.use(express.static('public'));
// connect().use(serveStatic("C:\\Users\\House\\Desktop\\Possum\\Road-Trip")).listen(8080, function(){
//     console.log('Server running on 8080...');
// });

var table_schemes = {foursquare: {}};

const test_foursquare_entry = {
  name: "The Star",
  rating: 8,
  rating_count: 150
};

var connection = mysql.createConnection({
  host     : '35.247.93.85',
  user     : 'node-manager',
  password : 'Node-password',
  database : 'restaurants',
  // ssl-ca : fs.readFileSync(__dirname + '/certs/server-ca.pem')
  // ssl-cert : fs.readFileSync(__dirname + '/certs/client-cert.pem')
  // ssl-key : fs.readFileSync(__dirname + '/certs/client-key.pem')
});
// Table structure
//   _______________________________
//  |  Field        |  Type         |
//  =================================
//  |  Name         |  varchar(50)  |
//  |  Rating       |  DECIMAL      |
//  |  Rating Count |  INTEGER      |
//  |  Address      |  varchar(50)  |
//  |  img_url      |  varchar(50)  |
//  |  API_id       |  varchar(100) |
//  |  Refreshed    |  DATETIME     |
//  =================================
// Structure as obj
var source_table = {
  name: 'varchar(50)',
  rating: 'DECIMAL',
  rating_count: 'INTEGER',
  address: 'varchar(50)',
  img_url: 'varchar(50)',
  api_id: 'varchar(100)',
  refreshed: 'DATETIME'
};

function test(){
  connection.connect();
  createTable("foursquare", source_table);
  insertIntoTable("foursquare", test_foursquare_entry);
  connection.query(`SELECT * FROM foursquare;`, function (error, results, fields) {
    if (error) throw error;
    console.log(results);
  });
  clearDB();
  connection.end();
}

// string JSON ---> void
// Create a table in the MySQL DB with given name and schema
function createTable(name, schema){
  var table_data = "";
  // console.log('Creating data string from schema');
  for(var key in schema){
    table_data += key + " " + schema[key] + ",";
  }
  table_data = table_data.substring(0,table_data.length-1);
  // console.log(table_data);
  var query = `CREATE TABLE ${name} (${table_data});`;
  // console.log(`Creating table ${name}`);
  connection.query(query, function (error, results, fields) {
    if (error) throw error;
    console.log(`Table "${name}" created`);
    table_schemes[name] = schema;
  });
}

// string JSON ---> void
// Insert data from given object into a given table
function insertIntoTable(table_name, data){
  var columns = "(";
  var values = "(";
  for(var key in data){
    columns += key + ",";
    if(typeof data[key] == "string"){
      values += "'" + data[key] + "',";
    }else{
      values += data[key] + ",";
    }
  }
  columns = columns.substring(0, columns.length - 1) + ")";
  values = values.substring(0, values.length - 1) + ")";
  var query = `INSERT INTO ${table_name} ${columns} VALUES ${values};`;
  // console.log(query);
  connection.query(query, function (error, results, fields) {
    if (error) throw error;
    console.log(`Values ${values} inserted into table "${table_name}"`);
  });
}

function clearDB(){
  var keys = Object.keys(table_schemes);
  for(var i in keys){
    var name = keys[i];
    connection.query(`DROP TABLE ${name};`,  function (error, results, fields) {
      if (error) throw error;
      console.log("Tables Dropped");
      delete table_schemes[name];
    });
  }
}

// TODO
function refreshEntry(table_name, id){}
function removeEntry(table_name, id){}
function tableHasEntry(table_name, id){return False;}
function getEntryData(table_name, id){return {};}

function alertHello(){
  alert("Hello World!");
}
// clearDB();
// test();
