const database = require("../../database.js");



async function deregisterUser(interaction) {
  let userID = interaction.user.id;
  if(await database.getUserRow(userID) == undefined) {
    interaction.reply("You're not even registered!");
    return;
  }
  let result = await database.removeUserData(userID);
  interaction.reply("Your account has been deregistered :(");
}

module.exports = {
  name:'deregister',
  description:'Removes an user and all associated data',
  async execute(interaction) {
    deregisterUser(interaction);
  },
};