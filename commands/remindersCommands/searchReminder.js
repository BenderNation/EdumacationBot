// imports
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");

async function searchReminder(interaction) {
    let userID = interaction.user.id;
    let reminderID = await interaction.options.getNumber("reminderid").catch(
      (e) => errorHandler(interaction, e)
    );
  
    let userRegistered = await checkUserRegistered(interaction, userID);
    console.log("is user registered? ", userRegistered);
    if (userRegistered) {
      let resultReminder = await database.findReminders(reminderID, userID).catch(
        (e) => errorHandler(interaction, e)
      );
      if (resultReminder === undefined) {
        await interaction.reply("No such reminder exists").catch(
          (e) => errorHandler(interaction, e)
        );
      } else {
        await interaction.reply(`Reminder ${reminderID}: ${resultReminder["noteMessage"]}`).catch(
          (e) => errorHandler(interaction, e)
        );
      }
    }
  }

  module.exports = {
    name: 'searchreminder',
    description: 'Search for a reminder from the database by reminder ID',
    options: [{name: 'reminderid', type: "NUMBER", description: 'ID of reminder to search for', required: true}],
    async execute(interaction) {
      searchReminder(interaction);
    },
  };