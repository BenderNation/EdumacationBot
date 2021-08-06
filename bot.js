const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');


client.on('ready', () => {
    console.log("Online");
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
  await interaction.reply({content:'help page', ephemeral: true});
};


//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
    if(interaction.commandName === 'help')
      runHelp(interaction);
      await client.guilds.cache.get('367198129633886209')?.commands.fetch()
      .then(commands => commands.each(
        cmd => console.log(`Name: ${cmd['name']}\nDescription: ${cmd['description']}`)
      )).catch(console.error);
});



client.login(process.env.BOT_PRIVATE);

//console.log("I am commenting my thingy: ",process.env.BOT_PRIVATE);

