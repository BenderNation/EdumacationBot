const SQLite3 = require('@journeyapps/sqlcipher').verbose();
const dbPath = './db/database.db';
require('dotenv').config();

/* db creates a database object from existing file or creates one if not found */

let db;

// data = [discordID, nickname, canvasToken, noteID, reminderID, reminderMessage, notify]

async function createUserTable() {
  let stm = db.prepare(`CREATE TABLE UserTable (
      discordID   TEXT PRIMARY KEY NOT NULL,
      nickname    TEXT,
      canvasToken TEXT,
      timezone    TEXT    DEFAULT 'UTC')`);
  return new Promise(async (resolve, reject) => {
    stm.run((err, val) => {
      if (err){
        console.error("User Table creation failure", err.message);
        reject(err);
        }
      else{
        console.log("Created user table");
        resolve(val);
      }
    }).finalize();
  });
}

async function createNotesTable() {
  let stm = db.prepare(`CREATE TABLE NotesTable (
    noteID      INTEGER PRIMARY KEY NOT NULL,
    discordID   TEXT,
    noteMessage TEXT,
    timeStamp   INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`);
  return new Promise(async function (resolve, reject) {
  
    stm.run((err, val) => {
      if (err) {
        console.error("Notes Table creation failure", err.message);
        reject(err);
      }
      else{
        console.log("Created notes table");
        resolve(val);
      }
    }).finalize();
  });
}

async function createReminderTable() {
  let stm = db.prepare(`CREATE TABLE ReminderTable (
    reminderID      INTEGER PRIMARY KEY NOT NULL,
    discordID       TEXT,
    reminderMessage TEXT,
    notifyTime      INTEGER,
    timeStamp       INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`)
  return new Promise(async function (resolve, reject)  {
    stm.run((err, val) => {
      if (err){
        console.error("Reminder Table creation failure", err.message);
        reject(err);
      }
      else{
        console.log("Created reminder table");
        resolve(val)
      }
    }).finalize();
  });
}

async function getUserTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='UserTable'";
  let promiseResult = new Promise((resolve, reject) => {
    db.get(cmd, function (err, val) {
        if(val == undefined)
          reject(val);
        else
          resolve(val);
    });
  })
  .then(() => {
    console.log("User database table found");
    })
  .catch(async () => {
    console.log("No user database table - creating one");
    await createUserTable();
  });
  return promiseResult;
}

async function getNotesTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='NotesTable'";
  
  let promiseResult = new Promise((resolve, reject) => {
    db.get(cmd, function (err, val) {
        if(val == undefined)
          reject(val);
        else
          resolve(val);
    });
  })
  .then(() => {
    console.log("Notes database table found");
    })
  .catch(async () => {
    console.log("No notes database table - creating one");
    await createNotesTable();
  });
  return promiseResult;

}

async function getReminderTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='ReminderTable'";
  let promiseResult = new Promise((resolve, reject) => {
    db.get(cmd, function (err, val) {
        if(val == undefined)
          reject(val);
        else
          resolve(val);
    });
  })
  .then(() => {
    console.log("Reminders database table found");
    })
  .catch(async () => {
    console.log("No reminders database table - creating one");
    await createReminderTable();
  });
  return promiseResult;

}

async function connect(path = dbPath) {
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
  const insertNotesTable = "INSERT into NotesTable (discordID, noteMessage, timeStamp) VALUES (?,?,?)";
  const insertReminderTable = "INSERT into ReminderTable (discordID, reminderMessage, notifyTime, timeStamp) VALUES (?,?,?,?)";

  let insertStatement = (tableName == 'UserTable') ? insertUserTable:
                        (tableName == "NotesTable") ? insertNotesTable:
                        (tableName == "ReminderTable") ? insertReminderTable:
                        null;
    
  return new Promise((resolve, reject) => {
    if(insertStatement == null){
      reject("Incorrect Table Name");
    }

    db.run(insertStatement, dataArray, function(err) {
      if(err) {
        reject(err);
      }
      resolve(this.lastID);});
  });
}

function modifyTimezone(discordID, tzString) {
  const insertStatement = "UPDATE UserTable SET timezone = ? WHERE discordID = ?";
  return new Promise((resolve, reject) => {
    db.run(insertStatement, [tzString, discordID], function(err) {
      if(err) {
        reject(err);
      }
      resolve(this.changes);});
  });
}

// switch (tableName) {
//  case('UserTable'): {
//     db.run(insertUserTable, dataArray, function(err) {
//       if(err) {
//         reject(err);
//       }
//       resolve(this.lastID);});
//     break;
//   }
//   case('NotesTable'): {
//     db.run(insertNotesTable, dataArray, function(err) {
//       if(err) {
//         reject(err);
//       }
//       resolve(this.lastID);});
//     // db.all("SELECT * from NotesTable", [] , (err, rows) => {if(err) console.error(err); else console.log(rows);});
//     break;
//   }
//   case('ReminderTable'): {
//     db.run(insertReminderTable, dataArray, function(err) {
//       if(err) {
//         reject(err);
//       }
//       resolve(this.lastID);});
//     // db.all("SELECT * from ReminderTable", [] , (err, rows) => {if(err) console.error(err); else console.log(rows);});
//     break;
//   }
  
//   default: {
//     reject(new Error("No such table: " + tableName));
//     break;
//   }
// }

function removeUserData(discordID) {
  const RemoveUserTable = "DELETE FROM UserTable WHERE discordID = ?";
  const RemoveNotesTable = "DELETE FROM NotesTable WHERE discordID = ?";
  const RemoveReminderTable = "DELETE FROM ReminderTable WHERE discordID = ?";


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

function findNotes(discordID, message) {
  let cmd, args;
  if(message === undefined) {
    cmd = "SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ?";
    args = [discordID];
  } else{
    cmd = "SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ? AND noteMessage LIKE ?";
    args = [discordID, "%"+message+"%"];
  }

  return new Promise((resolve, reject) => {
    db.all(cmd, args, (err, rows) => {
      if(err)
        reject(err);
      resolve(rows);
    });
  });
}

// findReminders is taken from findNotes
//  let stm = db.prepare(`CREATE TABLE ReminderTable (
  // reminderID      INTEGER PRIMARY KEY NOT NULL,
  // discordID       INTEGER,
  // reminderMessage TEXT,
  // notifyTime      INTEGER,
  // timeStamp       INTEGER,
  // FOREIGN KEY(discordID) references UserTable(discordID))`)
function findReminders(discordID, message) {
  let cmd, args;
  if(message === undefined) {
    cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ?";
    args = [discordID];
  } else{
    cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ? AND reminderMessage LIKE ?";
    args = [discordID, "%"+message+"%"];
  }

  return new Promise((resolve, reject) => {
    db.all(cmd, args, (err, rows) => {
      if(err)
        reject(err);
      resolve(rows);
    });
  });
}

// get the latest reminder in the table
function getLatestReminder() {
  return new Promise((resolve, reject) => {
    let stm = db.prepare("SELECT discordID, reminderID, reminderMessage, notifyTime FROM ReminderTable ORDER BY notifyTime ASC");
    stm.get([], (err, row) => {
      if(err)
        reject(err);
      else{ 
        resolve(row);
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

// here's how to do order by
// let dbCommand = `select * from ActivityTable where amount>-1 and userID = ${userID} and date <= ${oneWeekAgo} order by date DESC`;


function deleteItem(tableName, itemID) {
  const RemoveNoteCmd = "delete from NotesTable where noteID = ?";
  const RemoveReminderCmd = "delete from ReminderTable where reminderID = ?";
  
  return new Promise((resolve, reject) => {
    if (tableName === "NotesTable") {
      db.run(RemoveNoteCmd, itemID, function (err) {
        if(err)
          reject(err);
        else
          resolve(this.changes);
      });
    } else if (tableName === "ReminderTable") {
      db.run(RemoveReminderCmd, itemID, function (err) {
        if(err)
          reject(err);
        else
          resolve(this.changes);
      });
    }
    else {
      reject(new Error("Invalid Table Name: " + tableName));
    }
  });  
}


function getReminders(discordID, callback) {
  const cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ? ORDER BY notifyTime DESC";
  
  db.all(cmd, discordID);
  callback(result);
}

function deleteTable(tableName) {
  return new Promise((resolve, reject) => {
    db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
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
  getReminders,
  populateData,
  debugSQL,
  findNotes,
  deleteItem,
  modifyTimezone,
  getLatestReminder
}