// imports
const {checkUserRegistered, errorHandler, dateFormat} = require('../../helpers.js');
const { MessageEmbed } = require('discord.js');
const database = require("../../database.js");

async function getAllReminders(interaction) {
  let userID = interaction.user.id;
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let reminderResults = await database.findReminders(userID);
    let userResults = await database.getUserRow(userID);
    const remindersEmbed = new MessageEmbed()
    .setColor('#0dbadc')
    .setTitle(interaction.member.displayName + '\'s Reminders')
    .setTimestamp();
    for(var reminder of reminderResults) {
      try {
        let remindDate = dateFormat(userResults['timezone']).format(new Date(reminder['notifyTime']));
        remindersEmbed.addField("Reminder ID: " + reminder['reminderID'].toString(),
          "When: " + remindDate + 
          "\nMessage: " + reminder['reminderMessage'].toString(), false); 
      }
      catch (error) {
        errorHandler(interaction, error);
        return;
      };
    }
    try {
      await interaction.reply({embeds: [remindersEmbed], ephemeral: false});
    } catch (error) {
      errorHandler(interaction, error);
    }
  }
}

module.exports = {
  name:'getallreminders',
  description: 'Displays all reminders from user',
  async execute(interaction) {
    getAllReminders(interaction);
  },
};