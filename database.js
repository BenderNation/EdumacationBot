const SQLite3 = require('@journeyapps/sqlcipher').verbose();
const dbPath = './db/testDB.db';
const { table } = require('console');
const util = require('util');

require('dotenv').config();

/* db creates a database object from existing file or creates one if not found */

const db = new SQLite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connection to database established.');
});

//Promisify database functions for an easier time

const runDB = util.promisify(db.run.bind(db));
const getDB = util.promisify(db.get.bind(db));
const allDB = util.promisify(db.all.bind(db));

// data = [discordID, nickname, canvasToken, noteID, reminderID, reminderMessage, notify]

async function createUserTable() {
  let cmd = `CREATE TABLE UserTable (
    discordID   TEXT PRIMARY KEY NOT NULL,
    nickname    TEXT,
    canvasToken TEXT,
    timezone    TEXT    DEFAULT 'UTC')`;
  
  try {
    await runDB(cmd,[]);
    console.log("Created user table");
  } catch (err) {
    console.error("User Table creation failure", err.message);
  }
}

async function createNotesTable() {
  let cmd = `CREATE TABLE NotesTable (
    noteID      INTEGER PRIMARY KEY NOT NULL,
    discordID   TEXT,
    noteMessage TEXT,
    timeStamp   INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`;

  try {
    await runDB(cmd, []);
    console.log("Created notes table");
  } catch (err) {
    console.error("Notes Table creation failure", err.message);
  }
}

async function createReminderTable() {
  let cmd = `CREATE TABLE ReminderTable (
    reminderID      INTEGER PRIMARY KEY NOT NULL,
    discordID       TEXT,
    reminderMessage TEXT,
    notifyTime      INTEGER,
    timeStamp       INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`;

  try {
    await runDB(cmd, []);
    console.log("Created reminder table");
  } catch (err) {
    console.error("Reminder Table creation failure", err.message);
  }
}

async function getUserTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='UserTable'";

  try{
    let tableGetResult = await getDB(cmd, []);
    if(tableGetResult == undefined) {
      console.log("No user database table - creating one");
      await createUserTable();
    } else {
      console.log("User database table found");
    }
  } catch(err) {
    console.error(err);
  }
}

async function getNotesTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='NotesTable'";
  try{
    let tableGetResult = await getDB(cmd, []);
    if(tableGetResult == undefined) {
      console.log("No notes database table - creating one");
      await createUserTable();
    } else {
      console.log("Notes database table found");
    }
  } catch(err) {
    console.error(err);
  }

}

async function getReminderTable() {
  let cmd = "SELECT name FROM sqlite_master WHERE type='table' AND name='ReminderTable'";

  try{
    let tableGetResult = await getDB(cmd, []);
    if(tableGetResult == undefined) {
      console.log("No reminders database table - creating one");
      await createUserTable();
    } else {
      console.log("Reminders database table found");
    }
  } catch(err) {
    console.error(err);
  }

}

async function connect() {
  //Encrypts/decrypts the database with a passphrase
  await runDB(`PRAGMA key = ${process.env.DB_PASSWORD}`);

  //Enables foreign key contraints
  await runDB("PRAGMA foreign_keys = ON");  
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

async function removeUserData(discordID) {
  const RemoveUserTable = "DELETE FROM UserTable WHERE discordID = ?";
  const RemoveNotesTable = "DELETE FROM NotesTable WHERE discordID = ?";
  const RemoveReminderTable = "DELETE FROM ReminderTable WHERE discordID = ?";

  await runDB(RemoveNotesTable, discordID);
  await runDB(RemoveReminderTable, discordID);
  await runDB(RemoveUserTable, discordID);
  
}

async function getUserRow(discordID) {
  const cmd = "SELECT * from UserTable where discordID = ?";
  return await getDB(cmd, [discordID]);
}

// const getUserTableData = "SELECT from <tablename> where discordID = "value", canvasToken ="value"
async function getCanvasToken(discordID) {
  const cmd = "SELECT canvasToken from UserTable where discordID = ?";
  return await getDB(cmd, [discordID]);
}

async function findNotes(discordID, message) {
  let cmd, args;
  if(message === undefined) {
    cmd = "SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ?";
    args = [discordID];
  } else{
    cmd = "SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ? AND noteMessage LIKE ?";
    args = [discordID, "%"+message+"%"];
  }
  return await allDB(cmd, args);
}

// findReminders is taken from findNotes
//  let stm = db.prepare(`CREATE TABLE ReminderTable (
  // reminderID      INTEGER PRIMARY KEY NOT NULL,
  // discordID       INTEGER,
  // reminderMessage TEXT,
  // notifyTime      INTEGER,
  // timeStamp       INTEGER,
  // FOREIGN KEY(discordID) references UserTable(discordID))`)
async function findReminders(discordID, message) {
  let cmd, args;
  if(message === undefined) {
    cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ?";
    args = [discordID];
  } else{
    cmd = "SELECT reminderID, reminderMessage FROM ReminderTable WHERE discordID = ? AND reminderMessage LIKE ?";
    args = [discordID, "%"+message+"%"];
  }

  return await allDB(cmd, args);

}

// get the latest reminder in the table
async function getLatestReminder() {
  const cmd = "SELECT discordID, reminderID, reminderMessage, notifyTime FROM ReminderTable ORDER BY notifyTime ASC";
  return await getDB(cmd, []);

}

async function getNote(noteID, discordID) {
  const cmd = "SELECT noteMessage FROM NotesTable WHERE noteID = ? AND discordID = ?";
  return await getDB(cmd, [noteID, discordID]);
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


async function findReminders(discordID, message) {
  let cmd, args;
  if(message === undefined) {
    cmd = "SELECT reminderID, reminderMessage, notifyTime \
           FROM ReminderTable WHERE discordID = ? \
           ORDER BY notifyTime DESC";
    args = [discordID];
  } else{
    cmd = "SELECT reminderID, reminderMessage, notifyTime \
           FROM ReminderTable WHERE discordID = ? \
           AND reminderMessage LIKE ? \
           ORDER BY notifyTime DESC";
    args = [discordID, "%"+message+"%"];
  }
  return await allDB(cmd, args);
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
  findReminders,
  populateData,
  debugSQL,
  findNotes,
  deleteItem,
  modifyTimezone,
  getLatestReminder
}