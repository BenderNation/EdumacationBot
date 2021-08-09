const SQLite3 = require('sqlite3').verbose();

/* db creates a database object from existing file or creates one if not found */

let db = new SQLite3.Database('./db/database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Close the database connection.');
});