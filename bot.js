const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { getAllFiles, setReminderTimeout } = require('./helpers.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();

const commandFiles = getAllFiles('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

// expose the database
const database = require("./database.js");

client.once('ready', async function() {

  console.log('Ready!');
});

client.on('messageCreate', async message => {
  let strArr = message.content.split(" ");
  if (!client.application?.owner) await client.application?.fetch();

  if((strArr[0] === '-+removeTable' &&
      await client.application?.owner.members.has(message.author.id))) {

    await database.deleteTable(strArr[1])
    message.reply("Removed the table: " + strArr[1])
    .then(() => console.log(`Replied to message "${message.content}"`))
    .catch(console.error);
  }
});

//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

async function main() {
	await database.connect();
	await database.getUserTable();
	await database.getNotesTable();
	await database.getReminderTable();
	
	await setReminderTimeout(client);

}

main();

client.login(token);
