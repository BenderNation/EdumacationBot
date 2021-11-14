const { REST } = require('@discordjs/rest');
const { Client, Collection, Intents } = require('discord.js');

const { Routes } = require('discord-api-types/v9');
const { clientId, guildID, token } = require('./config.json');
const { getAllFiles } = require('./helpers.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


const commands = [];

const rest = new REST({ version: '9' }).setToken(token);

const commandFiles = getAllFiles('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${file}`);
	commands.push(command);
}

async function main(){
	await client.login(token);
	console.log(commands);
	try{
		for(cmd of commands){
		
			const cmdResult = await client.guilds.cache.get('367198129633886209')?.commands.create(cmd);
			console.log(cmdResult);
		}
		console.log("Successfully deployed commands");
	}
	catch(err) {
		console.error(err.message);
	}
}
main();


// rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
// 	.then(() => console.log('Successfully registered application commands.'))
// 	.catch(console.error);