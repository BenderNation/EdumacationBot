const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');

// expose the database
const database = require("./database.js");
const dbFile = "./db/testDB.db";


client.once('ready', () => {
	database.connect(dbFile);
  database.getUserTable();
  database.getNotesTable();
  database.getReminderTable();

  
  console.log('Ready!');
});

//Creating Commands to see in the /commands
client.on('messageCreate', async message => {
  let strArr = message.content.split(" ");
  if (!client.application?.owner) await client.application?.fetch();
  //Deploy commands to be registered onto Discord
	if (message.content.toLowerCase() === '-+deploy' && await client.application?.owner.members.has(message.author.id)) {
		const commands = [
    {
      name:'help',
      description:'Lists commands and how to use bot'
    },
    {
      name:'addnote',
      description:'Inserts a note into the Database',
      options: [{name: 'message', type: "STRING", description: 'The note to save', required: true}]
    },
    // {
    //   name:'deletenote',
    //   description:'Deletes a note from the Database',
    //   options: [{name: 'noteid', type: "NUMBER", description: 'ID of note to remove', required: true}]
    // },
    {
      name:'register',
      description:'Registers Discord user with bot',
    },
    {
      name: 'deregister',
      description: "Removes an user and all associated data",
    },
    {
      name: 'getnote',
      description: 'Grabbing notes from the database by note ID',
      options: [{name: 'noteid', type: "NUMBER", description: 'ID of note to grab', required: true}]
    },
    {
      name:'getnoteids',
      description: 'Grabs all notes from user',
    }
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
	} else if((strArr[0] === '-+removeTable' &&
             await client.application?.owner.members.has(message.author.id))) {

    await database.deleteTable(strArr[1])
    message.reply("Removed the table: " + strArr[1])
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
        var options = cmd['options'].map((opt) => opt['name']).toString();
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
    let cmdDesc;
    if(cmd['Options'].length == 0) {
      cmdDesc = `${cmd['Description']}`;
    }
    else{
      cmdDesc = `Options: ${cmd['Options']} \n ${cmd['Description']}`;
    }
    await exampleEmbed.addField(cmd['Command Name'], cmdDesc , false);

  }
  await interaction.reply({embeds: [exampleEmbed], ephemeral: true});
};

//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
  if(interaction.commandName === 'help')
    runHelp(interaction);
  else if(interaction.commandName === 'addnote')
    addNote(interaction);
  // else if(interaction.commandName === 'deletenote')
  //   deleteNote(interaction);
  else if(interaction.commandName === 'register')
    registerUser(interaction);
  else if(interaction.commandName === 'deregister')
    deregister(interaction);
  else if(interaction.commandName === 'getnoteids')
    getNoteIDs(interaction);
  else if(interaction.commandName === 'getnote')
    getNote(interaction);
});

// function insertData(tableName, dataArray)
// NotesTable
// const insertUserTable = "insert into UserTable (discordID, nickname, canvasToken) values (?,?,?)";
// const insertNotesTable = "insert into NotesTable (discordID, noteMessage) values (?,?)";
// const insertReminderTable = "insert into ReminderTable (discordID, reminderMessage, notifyTime) values (?,?,?)";

async function addNote(interaction) {
  let userID = interaction.member.id;
  let message = await interaction.options.getString("message");

  console.log(message);
  console.log(userID);
  let userRegistered = await checkUserRegistered(userID);
  console.log(userRegistered);
  if (userRegistered) {
    let returnID = await database.insertData("NotesTable", [userID, message]);
    interaction.reply(`Added Note ${returnID}`);

  } else {
    interaction.reply(`Please register with /register first!`);
  }
}

async function getNote(interaction) {
  let userID = interaction.member.id;
  let noteID = await interaction.options.getNumber("noteid");

  let userRegistered = await checkUserRegistered(userID);
  console.log(userRegistered);
  if (userRegistered) {
    let resultNote = await database.getNote(noteID, userID).catch(
      ()=>interaction.reply("Error grabbing note from database")
    );
    if (resultNote === undefined) {
        interaction.reply("No such note exists");
    } else {
        interaction.reply(`Note ${noteID}: ${row["noteMessage"]}`);
    }
  } else {
    interaction.reply(`Please register with /register first!`);
  }
}

// getting a list of noteIDs that are under one user
async function getNoteIDs(interaction) {
  let userID = interaction.member.id;
  

  let userRegistered = await checkUserRegistered(userID);
  if (userRegistered) {
    let noteResults = await database.getNotes(userID);
    interaction.reply(noteResults.map((rows) => rows['noteID']).toString());
  } else {
    interaction.reply(`Please register with /register first!`);
  }
}

// old header: async function registerUser(interaction, userID, nickname, canvasToken) {
async function registerUser(interaction) {
  let userID = interaction.member.id;
  // let nickname = await interaction.options.getMessage("nickname");
  // let canvasToken = await interaction.options.getMessage("nickname");
  
  let userRegistered = await checkUserRegistered(userID);
  if (!userRegistered) {
  database.insertData("UserTable", [userID, "nickname", "token"], (err) => {
    if(err) {
      console.error()
      interaction.reply(`Registration Failed with Error ${err}`);
    } else {
      interaction.reply("Registeration successful");
    }
  });
  } else {
    interaction.reply("You're already registered.");
  }
}

async function checkUserRegistered(discordID) {
  return (await database.getUserRow(discordID)) !== undefined;
}

async function deregister(interaction) {
  let userID = interaction.member.id;
  let result = await database.removeUserData(userID);
  interaction.reply("You're deregistered");
}


client.login(process.env.BOT_PRIVATE);
