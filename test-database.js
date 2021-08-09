const database = require("./database.js");
const testDB = "./db/testDB.db";


function createTables() {
  database.createUserTable();
  database.createNotesTable();
}

function populateData() {
  database.populateData();
}

async function main() {
  database.connect(testDB);
  // createTables();
  // populateData();
  database.findNotes(1, "po", console.log);
  database.closeDatabase();

}

main();