//imports
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");
const { MessageEmbed } = require('discord.js');



async function findNotes(interaction) {
  let userID = interaction.user.id;
  let noteMessage = await interaction.options.getString("message");

  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let resultNotes = await database.findNotes(userID, noteMessage).catch(
      (err) => {
        interaction.reply("Error occured while searching for notes");
        console.error(err);
      }
    );
    if (resultNotes === undefined) {
        interaction.reply("No notes found");
    } else {
      const notesEmbed = new MessageEmbed()
      .setColor('#0dbadc')
      .setTitle('Notes Search Results')
      .setDescription(interaction.member.displayName + `\'s results`)
      .setTimestamp();
      for(var note of resultNotes) {
        try { notesEmbed.addField("Note ID: " + note['noteID'].toString(), note['noteMessage'] , false); }
        catch (error) {errorHandler(interaction, error)};
      }
      try {
        await interaction.reply({embeds: [notesEmbed], ephemeral: false});
      } catch (error) {
        errorHandler(interaction, error);
      }
    }
  }
}

module.exports = {
  name:'findnotes',
  description: 'Searches through the table for posts for the keywords',
  options: [{name: 'message', type: "STRING", description: 'The keyword to search by', required: true}],
  async execute(interaction) {
    findNotes(interaction);
  },
};