//imports
const {checkUserRegistered, errorHandler} = require('../../helpers.js');

const database = require("../../database.js");



async function getNote(interaction) {
  let userID = interaction.user.id;
  let noteID = await interaction.options.getNumber("noteid");

  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
      let resultNote = await database.findNotes(noteID, userID).catch((e) => errorHandler(interaction,e));
    if (resultNote === undefined) {
        interaction.reply("No such note exists");
    } else {
        interaction.reply(`Note ${noteID}: ${resultNote["noteMessage"]}`);
    }
  }
}

module.exports = {
  name: 'getnote',
  description: 'Grabbing notes from the database by note ID',
  options: [{name: 'noteid', type: "NUMBER", description: 'ID of note to grab', required: true}],
  async execute(interaction) {
    getNote(interaction);
  },
};