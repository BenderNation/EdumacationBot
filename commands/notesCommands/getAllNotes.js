//imports
const { MessageEmbed } = require('discord.js');
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");

// getting a list of noteIDs that are under one user
async function getAllNotes(interaction) {
  let userID = interaction.user.id;
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let noteResults = await database.findNotes(userID);

    const notesEmbed = new MessageEmbed()
    .setColor('#0dbadc')
    .setTitle(interaction.member.displayName + '\'s Notes')
    .setTimestamp();
    try {
      for(var note of noteResults) {
          notesEmbed.addField("Note ID: " + note['noteID'].toString(), note['noteMessage'] , false); 
      }
      await interaction.reply({embeds: [notesEmbed], ephemeral: false});
    } catch (error) {
      errorHandler(interaction, error);
    }

    // interaction.reply(noteResults.map((rows) => rows['noteID']).toString());
  }
}
module.exports = {
  name:'getallnotes',
  description: 'Displays all notes from user',
  async execute(interaction) {
    getAllNotes(interaction);
  },
};