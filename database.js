const SQLite3 = require('@journeyapps/sqlcipher').verbose();
const dbPath = './db/database.db';
require('dotenv').config();

/* db creates a database object from existing file or creates one if not found */

let db;

// data = [discordID, nickname, canvasToken, noteID, reminderID, reminderMessage, notify]

function createUserTable() {
    const cmd = 'CREATE TABLE UserTable (discordID INTEGER PRIMARY KEY NOT NULL, nickname TEXT, canvasToken TEXT)';
    db.run(cmd, (err, val) => {
      if (err)
        console.error("User Table creation failure", err.message);
      else
        console.log("Created user table");
    });
}

function createNotesTable() {
  let stm = db.prepare(`CREATE TABLE NotesTable (
    noteID INTEGER PRIMARY KEY NOT NULL,
    discordID INTEGER,
    noteMessage TEXT,
    FOREIGN KEY(discordID) references UserTable(discordID))`)
  stm.run((err, val) => {
    if (err)
      console.error("Notes Table creation failure", err.message);
    else
      console.log("Created notes table");
  }).finalize();
}

function createReminderTable() {
  let stm = db.prepare(`CREATE TABLE ReminderTable (
    reminderID INTEGER PRIMARY KEY NOT NULL,
    discordID INTEGER,
    reminderMessage TEXT,
    notifyTime INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`)
  stm.run((err, val) => {
    if (err)
      console.error("Reminder Table creation failure", err.message);
    else
      console.log("Created reminder table");
  }).finalize();
}

function getUserTable() {
  let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='UserTable' ";
  db.get(cmd, function (err, val) { // sql method: .get(sql, params, (err, row))
    if (val == undefined) {
          console.log("No user database table - creating one");
          createUserTable();
    } else {
          console.log("User database table found");
    }
  });
}

function getNotesTable() {
  let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='NotesTable' ";
  db.get(cmd, function (err, val) { // sql method: .get(sql, params, (err, row))
    if (val == undefined) {
          console.log("No notes database - creating one");
          createNotesTable();
    } else {
          console.log("Notes database table found");
    }
  });
}

function getReminderTable() {
  let stm = db.prepare(" SELECT name FROM sqlite_master WHERE type='table' AND name='ReminderTable' ");
  stm.get(function (err, val) { // sql method: .get(sql, params, (err, row))
    if (val == undefined) {
          console.log("No reminders database - creating one");
          createReminderTable();
    } else {
          console.log("Reminders database table found");
    }
  }).finalize();
}

function connect(path = dbPath) {
  db  = new SQLite3.Database(path, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connection to database established.');
  });

  //Encrypts/decrypts the database with a passphrase
  db.run(`PRAGMA key = ${process.env.DB_PASSWORD}`);

  //Enables foreign key contraints
  db.run("PRAGMA foreign_keys = ON");
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}

function insertData(tableName, dataArray) {
  // insert string literals for all three tables
  // ex of use: insertUserTable(<value for discordID>, <value of nickname>, <value for canvasToken>);
  //            the above generates a string with the apporiate values
  const insertUserTable = "INSERT into UserTable (discordID, nickname, canvasToken) VALUES (?,?,?)";
  const insertNotesTable = "INSERT into NotesTable (discordID, noteMessage) VALUES (?,?)";
  const insertReminderTable = "INSERT into ReminderTable (discordID, reminderMessage, notifyTime) VALUES (?,?,?)";


  return new Promise((resolve, reject) => {
    switch (tableName) {
      case('UserTable'): {
        db.run(insertUserTable, dataArray, function(err) {
          if(err) {
            reject(err);
          }
          resolve(this.lastID);});
        break;
      }
      case('NotesTable'): {
        db.run(insertNotesTable, dataArray, function(err) {
          if(err) {
            reject(err);
          }
          resolve(this.lastID);});
        db.all("SELECT * from NotesTable", [] , (err, rows) => {if(err) console.error(err); else console.log(rows);});
        break;
      }
      case('ReminderTable'): {
        db.run(insertReminderTable, dataArray, function(err) {
          if(err) {
            reject(err);
          }
          resolve(this.lastID);});
        break;
      }
      default: {
        reject(new Error("No such table: " + tableName));
        break;
      }
    }

  });
}



function removeUserData(discordID) {
  const RemoveUserTable = "delete from UserTable where discordID = ?";
  const RemoveNotesTable = "delete from NotesTable where discordID = ?";
  const RemoveReminderTable = "delete from ReminderTable where discordID = ?";


  return new Promise((resolve, reject) => {
    db.run(RemoveNotesTable, discordID, (err) => reject(err));
    db.run(RemoveReminderTable, discordID, (err) => reject(err));
    db.run(RemoveUserTable, discordID, (err) => reject(err));
    resolve(true);
  });


}

// function getUserRow(discordID, callback) {
//   let stm = db.prepare("SELECT * from UserTable where discordID = ?");
//   stm.get([discordID], callback);
// }

function getUserRow(discordID) {
  return new Promise((resolve,reject) => {
    let stm = db.prepare("SELECT * from UserTable where discordID = ?");
    stm.get([discordID], (err, row) =>{
      if(err) 
        reject(err);
      else
        // resolve(row);
        resolve(row)
    }).finalize();
  });
}

// const getUserTableData = "SELECT from <tablename> where discordID = "value", canvasToken ="value"
function getCanvasToken(discordID, callback) {
  let stm = db.prepare("SELECT canvasToken from UserTable where discordID = ?");
  stm.get([discordID], (err, row) => {
    if(err)
      console.error(err);
    callback(row);
  }).finalize();
}

function getNotes(discordID) {
  return new Promise((resolve, reject) => {
    let stm = db.prepare("SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ?");

    stm.all([discordID], (err, rows) => {
      if(err)
        reject(err);
      else{ 
        console.log(rows);
        resolve(rows);
      }
    }).finalize();
  });
}

function getNote(noteID, discordID) {
  return new Promise((resolve, reject) => {
    let stm = db.prepare("SELECT noteMessage FROM NotesTable WHERE noteID = ? AND discordID = ?");
    stm.get([noteID, discordID], (err, row) => {
      if(err)
        reject(err);
      else{ 
        resolve(row);
      }
    }).finalize();
  });
}

function findNotes(discordID, message, callback) {
  const cmd = "SELECT noteMessage FROM NotesTable WHERE discordID = ? AND noteMessage LIKE ?";

  db.all(cmd, [discordID, "%"+message+"%"], (err, rows) => {
    if(err)
      console.error(err);
    callback(rows);
  });
}

// here's how to do order by
// let dbCommand = `select * from ActivityTable where amount>-1 and userID = ${userID} and date <= ${oneWeekAgo} order by date DESC`;

function getReminders(discordID, callback) {
  const cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ? ORDER BY notifyTime DESC";
  
  db.all(cmd, discordID);
  callback(result);
}

function deleteTable(tableName) {
  // return new Promise((resolve,reject) => {
  //   let stm = db.prepare("SELECT * from UserTable where discordID = ?");
  //   stm.get([discordID], (err, row) =>{
  //     if(err) 
  //       reject(err);
  //     else
  //       // resolve(row);
  //       resolve(row)
  //   }).finalize();
  // });
  return new Promise((resolve, reject) => {
    db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
  // db.run("DELETE * FROM sqlite_master WHERE name= ?", [TableName], (err) => {if(err) console.Error(err);});
}

// const insertUserTable = "insert into UserTable (discordID, nickname, canvasToken) values (?,?,?)";
// const insertNotesTable = "insert into NotesTable (noteID, discordID, noteMessage) values (?,?,?)";
// const insertReminderTable = "insert into ReminderTable (reminderID, discordID, reminderMessage, notifyTime) values (?,?,?,?)";

function populateData() {
  insertData("UserTable", [1,,]);
  insertData("NotesTable", [1,1,"poop"]);
  insertData("NotesTable", [2,1,"hi"]);
  insertData("NotesTable", [3,1,"hello"]);
  insertData("NotesTable", [4,1,"oops"]);
  insertData("NotesTable", [5,1,"lol"]);
}

// emergency debug funct :L
function debugSQL(command) {
  db.run(command);
}

module.exports = {
  createUserTable,
  createNotesTable,
  createReminderTable,
  getUserTable,
  getNotesTable,
  getReminderTable,
  connect,
  closeDatabase,
  deleteTable,
  insertData,
  removeUserData,
  getUserRow,
  getCanvasToken,
  getNote,
  getNotes,
  getReminders,
  populateData,
  debugSQL,
  findNotes
}