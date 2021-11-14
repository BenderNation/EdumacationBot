const database = require("../../database.js");

const {checkUserRegistered, errorHandler} = require('../../helpers.js');

async function registerUser(interaction) {
  let userID = interaction.user.id;
  // let nickname = await interaction.options.getMessage("nickname");
  // let canvasToken = await interaction.options.getMessage("nickname");
  
  let userRegistered = await database.getUserRow(userID)
    .catch((err)=>errorHandler(interaction, err));
  if (userRegistered == undefined) {
    database.insertData("UserTable", [userID, "nickname", "token"]).catch((e) => interaction.reply(`Registration Failed with Error ${e}`));
    interaction.reply("Your account has been registered!");
  } else {
    interaction.reply("You're already registered.");
  }
}

module.exports = {
  name:'register',
  description:'Registers Discord user with bot',
  async execute(interaction) {
    registerUser(interaction);
  },
};