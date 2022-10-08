//imports
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");

async function deleteNote(interaction) {
  let userID = interaction.user.id;
  let noteID = await interaction.options.getNumber("noteid");
  
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let changes = await database.deleteItem("NotesTable", noteID).catch(
      (err)=>errorHandler(interaction, err)
    );
    if (changes === 0) {
      interaction.reply("No such note exists");
    } else {
      interaction.reply(`Note ${noteID} deleted`);
    }
  }
}

module.exports = {
  name:'deletenote',
  description:'Deletes a note from the Database',
  options: [{name: 'noteid', type: "NUMBER", description: 'ID of note to remove', required: true}],
  async execute(interaction) {
    deleteNote(interaction);
  },
};