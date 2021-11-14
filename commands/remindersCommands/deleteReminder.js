// imports
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");

async function deleteReminder(interaction) {
  let userID = interaction.user.id;
  let reminderID = await interaction.options.getNumber("reminderid");
  
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let changes = await database.deleteItem("ReminderTable", reminderID).catch(
      (err)=>errorHandler(interaction, err)
    );
    if (changes === 0) {
      interaction.reply("No such reminder exists");
    } else {
      interaction.reply(`Reminder ${reminderID} deleted`);
    }
  }
}

module.exports = {
  name: 'deletereminder',
  description: 'Deleting a reminder from the database by reminder ID',
  options: [{name: 'reminderid', type: "NUMBER", description: 'ID of reminder to delete', required: true}],
  async execute(interaction) {
    deleteReminder(interaction);
  },
};