const SQLite3 = require('sqlite3').verbose();
const dbPath = './db/database.db';

/* db creates a database object from existing file or creates one if not found */

let db;
//const db = new sql.Database("UserTable");
//const insertDB = "insert into ActivityTable (activity, date, amount, userID) values (?,?,?,?)";

function createUserTable() {
    // explicitly declaring the rowIdNum protects rowids from changing if the 
    // table is compacted; not an issue here, but good practice
    const cmd = 'CREATE TABLE UserTable (discordID TEXT PRIMARY KEY, nickname TEXT)';
    db.run(cmd, (err, val) => {
      if (err)
        console.log("Table creation failure", err.message);
      else
        console.log("Created user table");
    });
}

function get() {
  let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='UserTable' ";
  db.get(cmd, function (err, val) { // sql method: .get(sql, params, (err, row))
    if (val == undefined) {
          console.log("No database file - creating one");
          createUserTable();
    } else {
          console.log("Database file found");
    }
  });
}

function connect(path = dbPath) {
  db  = new SQLite3.Database(path, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('New database object created.');
  });
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}