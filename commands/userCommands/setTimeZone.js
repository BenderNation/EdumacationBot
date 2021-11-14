
const {checkUserRegistered, errorHandler, isValidTimezone} = require('../../helpers.js');
const database = require("../../database.js");



async function setTimeZone(interaction) {
  let userID = interaction.user.id;
  let tzString = await interaction.options.getString("timezone");
  checkUserRegistered(interaction, userID);

  if(isValidTimezone(tzString)) {
    let tzUpdateResult;
    try{
      tzUpdateResult = await database.modifyTimezone(userID, tzString)
      interaction.reply("Successfully set your timezone to " + tzString);
    } catch (e){
      errorHandler(interaction, e);
      return;
    }
  } else {
    interaction.reply(tzString + " is an invalid timezone string");
  }
}

module.exports = {
    name:'settimezone',
    description: 'Sets the user\'s time zone',
    options: [{name: 'timezone', type: "STRING", description: 'Timezone string following international standard', required: true}],
  async execute(interaction) {
    setTimeZone(interaction);
  },
};