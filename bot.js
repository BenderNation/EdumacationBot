const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');


client.on('ready', () => {
    console.log("Online");
});
  
client.on('messageCreate', async message => {

	if (message.content.toLowerCase() === '-+test') {
		const data =
    {
      name:'help',
      description:'explains how to use bot',

    };
    console.log(message.content);
		const command = await client.guilds.cache.get('367198129633886209')?.commands.create(data);
		console.log(command);
	}
});




client.login(process.env.BOT_PRIVATE);

//console.log("I am commenting my thingy: ",process.env.BOT_PRIVATE);

