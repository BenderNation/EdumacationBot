const SQLite3 = require('sqlite3').verbose();
const dbPath = './db/database.db';

/* db creates a database object from existing file or creates one if not found */

let db;

// data = [discordID, nickname, canvasToken, noteID, reminderID, reminderMessage, notify]

function createUserTable() {
    const cmd = 'CREATE TABLE UserTable (discordID INTEGER PRIMARY KEY, nickname TEXT, canvasToken TEXT)';
    db.run(cmd, (err, val) => {
      if (err)
        console.error("User Table creation failure", err.message);
      else
        console.log("Created user table");
    });
}

function createNotesTable() {
  const cmd = `CREATE TABLE NotesTable (
    noteID INTEGER PRIMARY KEY,
    discordID INTEGER,
    noteMessage TEXT,
    FOREIGN KEY(discordID) references UserTable(discordID))`;
  db.run(cmd, (err, val) => {
    if (err)
      console.error("Notes Table creation failure", err.message);
    else
      console.log("Created notes table");
  });
}

function createReminderTable() {
  const cmd = `CREATE TABLE ReminderTable (
    reminderID INTEGER PRIMARY KEY,
    discordID INTEGER,
    reminderMessage TEXT,
    notifyTime INTEGER,
    FOREIGN KEY(discordID) references UserTable(discordID))`;
  db.run(cmd, (err, val) => {
    if (err)
      console.error("Reminder Table creation failure", err.message);
    else
      console.log("Created reminder table");
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
      console.erroror(err.message);
    }
    console.log('Connection to database established.');
  });

  //Enables foreign key contraints
  db.run("PRAGMA foreign_keys = ON");
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      return console.erroror(err.message);
    }
    console.log('Close the database connection.');
  });
}

function deleteTable(table) {
  db.run(`delete from ${table}`);
  db.run("vacuum");
}

function insertData(tableName, dataArray) {
  // insert string literals for all three tables
  // ex of use: insertUserTable(<value for discordID>, <value of nickname>, <value for canvasToken>);
  //            the above generates a string with the apporiate values
  const insertUserTable = "insert into UserTable (discordID, nickname, canvasToken) values (?,?,?)";
  const insertNotesTable = "insert into NotesTable (noteID, discordID, noteMessage) values (?,?,?)";
  const insertReminderTable = "insert into ReminderTable (reminderID, discordID, reminderMessage, notifyTime) values (?,?,?,?)";

  switch (tableName) {
    case('UserTable'):
      db.run(insertUserTable, dataArray);
      break;
    case('NotesTable'):
      db.run(insertNotesTable, dataArray);
      break;
    case('ReminderTable'):
      db.run(insertReminderTable, dataArray);
      break;
    default:
      console.error("No such table: " + tableName);
      break;
  }
}

const RemoveUserTable = "delete from UserTable where discordID = ?";
const RemoveNotesTable = "delete from NotesTable where discordID = ? and NoteID = ?";
const RemoveReminderTable = "delete from ReminderTable where discordID = ? and reminderID = ?";

function RemoveSelectedData(tableName, dataArray) {
  switch (tableName) {
    case('UserTable'):
      db.run(RemoveUserTable, dataArray);
      break;
    case('NotesTable'):
      db.run(RemoveNotesTable, dataArray);
      break;
    case('ReminderTable'):
      db.run(RemoveReminderTable, dataArray);
      break;
    default:
      console.erroror("No such table: " + tableName);
      break;
  }
}

// const getUserTableData = "SELECT from <tablename> where discordID = "value", canvasToken ="value"
function getCanvasToken(discordID, callback) {
  const cmd = "SELECT canvasToken from UserTable where discordID = ?";
  db.get(cmd, discordID, (err, row) => {
    if(err)
      console.error(err);
    callback(row);
  });
}

function getNotes(discordID, callback) {
  const cmd = "SELECT noteID, noteMessage FROM NotesTable WHERE discordID = ?";

  db.all(cmd, [discordID], (err, rows) => {
    if(err)
      console.error(err);
    callback(rows);
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

// for testing purposes

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
  get,
  connect,
  closeDatabase,
  deleteTable,
  insertData,
  RemoveSelectedData,
  getCanvasToken,
  getNotes,
  getReminders,
  populateData,
  debugSQL,
  findNotes
}