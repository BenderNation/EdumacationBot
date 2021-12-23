//imports
// const checkUserRegistered = require('../checkRegistered.js').checkUserRegistered;
const {checkUserRegistered, errorHandler} = require('../../helpers.js');

const database = require("../../database.js");

async function addNote(interaction) {
  let userID = interaction.user.id;
  let message = await interaction.options.getString("message");

  let time = Date.now();

  try {
    let userRegistered = await checkUserRegistered(interaction,userID);
    if (userRegistered) {
      let returnID = await database.insertData("NotesTable", [userID, message, time]);
      interaction.reply(`Added Note ${returnID}`);
    }
  } catch (error) {
    errorHandler(interaction,error);
  }
}

module.exports = {
  name:'addnote',
  description:'Inserts a note into the Database',
  options: [{name: 'message', type: "STRING", description: 'The note to save', required: true}],
  async execute(interaction) {
    addNote(interaction);
  },
};