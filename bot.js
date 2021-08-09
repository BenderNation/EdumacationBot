const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');

client.once('ready', () => {
	console.log('Ready!');
});


//Creating Commands to see in the /commands
client.on('messageCreate', async message => {

  if (!client.application?.owner) await client.application?.fetch();
  //Deploy commands to be registered onto Discord
	if (message.content.toLowerCase() === '-+deploy' && await client.application?.owner.members.has(message.author.id)) {
		const data =
    {
      name:'help',
      description:'explains how to use bot',
    };
		const command = await client.guilds.cache.get('367198129633886209')?.commands.create(data);
		console.log(command);
	}
});

//First Command Help
async function runHelp(interaction){

  const exampleEmbed = new MessageEmbed()
  .setColor('#0dbadc')
  .setTitle('Help Page')
  .setDescription('The List of Commands')
  .setTimestamp();
  await interaction.reply({embeds: [exampleEmbed], ephemeral: true});
};

async function listOfCommands(){
  var commandList = await client.guilds.cache.get('367198129633886209')?.commands.fetch()
    .then(commands => commands.map(
      cmd => {
        var name = "/"+ cmd['name'];
        var description = cmd['description'];
        var options = cmd["options"];
        return {'Command Name': name, 'Description': description, 'Options': options};

      })
    );
  
  return commandList;

};



//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
    if(interaction.commandName === 'help')
      // runHelp(interaction);

      var test = await listOfCommands();
      console.log(test);

});



client.login(process.env.BOT_PRIVATE);

//console.log("I am commenting my thingy: ",process.env.BOT_PRIVATE);

