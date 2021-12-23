const database = require("../../database.js");
const {checkUserRegistered, errorHandler} = require('../../helpers.js');

async function insertCanvasToken(interaction) {
  let userID = interaction.user.id;
  let canvasToken = await interaction.options.getString("canvastoken");
  let domain = await interaction.options.getString("canvasdomain");

  try {
    let userRegistered = await checkUserRegistered(interaction,userID);
    if (userRegistered) {
      let returnID = await database.modifyCanvasToken(userID, canvasToken, domain);
      interaction.reply(`Successfully inserted Canvas token`);
    }
  } catch (error) {
    errorHandler(interaction,error);
  }
}

module.exports = {
  name:'insertcanvastoken',
  description:'Insert',
  options: [
    {name: 'canvastoken', type: "STRING", description: 'Token from Canvas', required: true},
    {name: 'canvasdomain', type: "STRING", description: 'Canvas Domain', required: true}],
  async execute(interaction) {
    insertCanvasToken(interaction);
  },
};