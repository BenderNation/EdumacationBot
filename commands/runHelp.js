const {errorHandler} = require('../helpers.js');
const { MessageEmbed } = require('discord.js');

//Command Help
async function listOfCommands(client){
  var commandList = await client.guilds.cache.get('367198129633886209')?.commands.fetch()
    .then(commands => commands.map(
      cmd => {
        var name = "/"+ cmd['name'];
        var description = cmd['description'];
        var options = cmd['options'].map((opt) => opt['name']).toString();
        return {'Command Name': name, 'Description': description, 'Options': options};

      })
    );
  
  return commandList;

};

async function runHelp(interaction, client){

  const helpEmbed = new MessageEmbed()
  .setColor('#0dbadc')
  .setTitle('Help Page')
  .setDescription('The List of Commands')
  .setTimestamp();
  var commandList = await listOfCommands(client)
  try {
    for(var cmd of commandList) {
      let cmdDesc;
      if(cmd['Options'].length == 0) {
        cmdDesc = `${cmd['Description']}`;
      }
      else{
        cmdDesc = `Options: ${cmd['Options']} \n ${cmd['Description']}`;
      }
      await helpEmbed.addField(cmd['Command Name'], cmdDesc , false);

    }
    await interaction.reply({embeds: [helpEmbed], ephemeral: true});
  } catch (error) {
    errorHandler(interaction, error);
  }

};

module.exports = {
  name:'help',
  description:'Lists commands and how to use bot',
  async execute(interaction, client) {
    runHelp(interaction, client);
  }
}