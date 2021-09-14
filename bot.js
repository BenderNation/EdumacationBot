const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');

// expose the database
const database = require("./database.js");
const dbFile = "./db/testDB.db";



client.once('ready', () => {
	database.connect(dbFile);
  // database.createUserTable();
  // database.createNotesTable();
  // database.createReminderTable();
  
  console.log('Ready!');
});





//Creating Commands to see in the /commands
client.on('messageCreate', async message => {

  if (!client.application?.owner) await client.application?.fetch();
  //Deploy commands to be registered onto Discord
	if (message.content.toLowerCase() === '-+deploy' && await client.application?.owner.members.has(message.author.id)) {
		const commands = [
    {
      name:'help',
      description:'Lists commands and how to use bot',
    },
    {
      name:'addnote',
      description:'Inserts a note into the Database',
      options: [{name: 'message', type: "STRING", description: 'The note to save', required: true}]
    },
    {
      name:'deletenote',
      description:'Deletes a note from the Database',
      options: [{name: 'noteid', type: "INTEGER", description: 'ID of note to remove', required: true}]
    },
    // {
    //   name:'getnotes',
    //   description:'Sends all notes made by user',
    // },
    // {
    //   name:'register',
    //   description:'Registers Discord user with bot',
    // }
    ];
		try{
      for(cmd of commands){
        const cmdResult = await client.guilds.cache.get('367198129633886209')?.commands.create(cmd);
        console.log(cmdResult);
      }
    }
    catch(err) {
      console.error(err.message);
    }

    message.reply("Successfully deployed commands")
    .then(() => console.log(`Replied to message "${message.content}"`))
    .catch(console.error);
	}
});

//Command Help
async function listOfCommands(){
  var commandList = await client.guilds.cache.get('367198129633886209')?.commands.fetch()
    .then(commands => commands.map(
      cmd => {
        var name = "/"+ cmd['name'];
        var description = cmd['description'];
        var options = cmd['options'];
        return {'Command Name': name, 'Description': description, 'Options': options};

      })
    );
  
  return commandList;

};

async function runHelp(interaction){

  const exampleEmbed = new MessageEmbed()
  .setColor('#0dbadc')
  .setTitle('Help Page')
  .setDescription('The List of Commands')
  .setTimestamp();
  var commandList = await listOfCommands()
  for(var cmd of commandList) {
    await exampleEmbed.addField(cmd['Command Name'], `Options: ${cmd['Options']} \n ${cmd['Description']}`, false);
  }
  await interaction.reply({embeds: [exampleEmbed], ephemeral: true});
};

//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
  if(interaction.commandName === 'help')
    runHelp(interaction);
  if(interaction.commandName === 'addnote')
    addNote(interaction);
});

// function insertData(tableName, dataArray)
// NotesTable
// const insertUserTable = "insert into UserTable (discordID, nickname, canvasToken) values (?,?,?)";
// const insertNotesTable = "insert into NotesTable (discordID, noteMessage) values (?,?)";
// const insertReminderTable = "insert into ReminderTable (discordID, reminderMessage, notifyTime) values (?,?,?)";

async function addNote(interaction) {
  let userID = interaction.member.id;
  let message = await interaction.options.getMessage("Message");
  let insertResult = database.insertData("NotesTable", [userID, message]);
  if(insertResult != -1) {
    interaction.reply(`Successfully added note ID #${insertResult}`);
  }
  else {
    interaction.reply(`failed big time, get gud`);
  }
}


async function getNote(noteID) {
  
}

async function getAllNotes(interaction) {
  let userID = interaction.member.id;
  
}

async function registerUser(userID, nickname, canvasToken) {
  database.insertData("UserTable", [userID, nickname, canvasToken]);
}

client.login(process.env.BOT_PRIVATE);

//console.log("I am commenting my thingy: ",process.env.BOT_PRIVATE);

