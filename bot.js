const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
require('dotenv').config();
const { MessageEmbed } = require('discord.js');

// expose the database
const database = require("./database.js");
const dbFile = "./db/testDB.db";


client.once('ready', async function() {
	await database.connect(dbFile);
  await database.getUserTable();
  await database.getNotesTable();
  await database.getReminderTable();
  await setReminderTimeout();

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
    {
      name:'deletenote',
      description:'Deletes a note from the Database',
      options: [{name: 'noteid', type: "NUMBER", description: 'ID of note to remove', required: true}]
    },
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
      name:'getallnotes',
      description: 'Displays all notes from user',
    },
    {
      name:'addreminder',
      description: 'Adds a reminder to the database under user ID',
      options: [{name: 'message', type: "STRING", description: 'The reminder to save', required: true},
                {name: 'notifytime', type: "STRING", description: 'The time to remind, format: 04 Dec 1995 00:12:00 GMT', required: true}]
    },
    {
      name: 'deletereminder',
      description: 'Deleting a reminder from the database by reminder ID',
      options: [{name: 'reminderid', type: "NUMBER", description: 'ID of reminder to delete', required: true}]
    },
    {
      name: 'searchreminder',
      description: 'Search for a reminder from the database by reminder ID',
      options: [{name: 'reminderid', type: "NUMBER", description: 'ID of reminder to search for', required: true}]
    },
    {
      name:'getallreminders',
      description: 'Displays all reminders from user',
    },
    {
      name:'findnotes',
      description: 'Searches through the table for posts for the keywords',
      options: [{name: 'message', type: "STRING", description: 'The keyword to search by', required: true}]
    },
    {
      name:'settimezone',
      description: 'Sets the user\'s time zone',
      options: [{name: 'timezone', type: "STRING", description: 'Timezone string following international standard', required: true}]
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

  const helpEmbed = new MessageEmbed()
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
    await helpEmbed.addField(cmd['Command Name'], cmdDesc , false);

  }
  await interaction.reply({embeds: [helpEmbed], ephemeral: true});
};

//Utilizing the command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
  if(interaction.commandName === 'help')
    runHelp(interaction);
  else if(interaction.commandName === 'register')
    registerUser(interaction);
  else if(interaction.commandName === 'deregister')
    deregister(interaction);
  
  else if(interaction.commandName === 'addnote')
    addNote(interaction);
  else if(interaction.commandName === 'deletenote')
    deleteNote(interaction);
  else if(interaction.commandName === 'getallnotes')
    getAllNotes(interaction);
  else if(interaction.commandName === 'getnote')
    getNote(interaction);
  else if (interaction.commandName === 'findnotes')
    findNotes(interaction);
    
  else if (interaction.commandName === 'addreminder')
    addReminder(interaction);
  else if (interaction.commandName === 'getallreminders')
    getAllReminders(interaction);
  else if (interaction.commandName === 'deletereminder')
    deleteReminder(interaction);
  else if (interaction.commandName === 'searchreminder')
    searchReminder(interaction);

  else if (interaction.commandName === 'settimezone')
    setTimeZone(interaction);

});

///////////////////////////////////////////////////////////////////////////////////////////
// Reminder Table section                                                                //
///////////////////////////////////////////////////////////////////////////////////////////

// using the currentReminder to store the current Timeout
var currentReminder;

// const insertReminderTable = "insert into ReminderTable (discordID, reminderMessage, notifyTime, timeStamp) values (?,?,?,?)";
async function addReminder(interaction) {
  let userID = interaction.user.id;
  let message = await interaction.options.getString("message");
  let notifTimeInput = await interaction.options.getString("notifytime");

  let time = Date.now();
  // const javaScriptRelease = Date.parse('04 Dec 1995 00:12:00 GMT');
  let notifyTime = Date.parse(notifTimeInput);

  console.log(`Reminder msg: ${message} currentTime:${time} notifyTime: ${notifyTime}`);

  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let returnID = await database.insertData("ReminderTable", [userID, message, notifyTime, time]).catch((e) => {interaction.reply(`addReminder failed due to error: ${e}`)});
    interaction.reply(`Added Reminder ${returnID}`);

    setReminderTimeout();
  }
}

async function setReminderTimeout() {
    // doing setTimeOut for the next reminder check
    if (currentReminder != null)
    clearTimeout(currentReminder);

    // get the earliest reminder
    let earliestReminder = await database.getLatestReminder().catch(
      (err)=>console.error("Error getting latest reminder:" + err));
    if(earliestReminder !== undefined){
      let time = Date.now();
      console.log("Current time", time);
      time = earliestReminder['notifyTime'] - time;
      console.log("Reminder", earliestReminder);
      console.log("Time before remind", time);
      if (time <= 0)
        await remindUser(earliestReminder);
      else
        currentReminder = setTimeout(async function() {
          await remindUser(earliestReminder);
      }, time);
    } else
      currentReminder = null;
}

async function deleteReminder(interaction) {
  let userID = interaction.user.id;
  let reminderID = await interaction.options.getNumber("reminderid");
  
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let changes = await database.deleteItem("ReminderTable", reminderID).catch(
      (err)=>error_handler(interaction, err)
    );
    if (changes === 0) {
      interaction.reply("No such reminder exists");
    } else {
      interaction.reply(`Reminder ${reminderID} deleted`);
    }
  }
}

async function getLatestReminder() {
  let resultReminder = await database.getLatestReminder().catch(
    (err)=>console.error("Error getting latest reminder:" + err));
  if (resultReminder === undefined) {
      return null;
  } else {
      return resultReminder;
  }
}

async function searchReminder(interaction) {
  let userID = interaction.user.id;
  let reminderID = await interaction.options.getNumber("reminderid");

  let userRegistered = await checkUserRegistered(interaction, userID);
  console.log("is user registered? ", userRegistered);
  if (userRegistered) {
    let resultReminder = await database.findReminders(reminderID, userID).catch(
      ()=>interaction.reply("Error grabbing reminder from database")
    );
    if (resultReminder === undefined) {
        interaction.reply("No such reminder exists");
    } else {
        interaction.reply(`Reminder ${reminderID}: ${resultReminder["noteMessage"]}`);
    }
  }
}

async function getAllReminders(interaction) {
  let userID = interaction.user.id;
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let reminderResults = await database.findReminders(userID);
    let userResults = await database.getUserRow(userID);
    const remindersEmbed = new MessageEmbed()
    .setColor('#0dbadc')
    .setTitle(interaction.member.displayName + '\'s Reminders')
    .setTimestamp();
    for(var reminder of reminderResults) {
      try {
        let remindDate = new Intl.DateTimeFormat('en-US', {
          timeZone: userResults['timezone'],
          timeZoneName: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          year: 'numeric'
        }).format(
          new Date(reminder['notifyTime'])
        );
        remindersEmbed.addField("Reminder ID: " + reminder['reminderID'].toString(),
          "When: " + remindDate,
          reminder['reminderMessage'], false); 
      }
      catch (error) {
        error_handler(interaction, error);
        return;
      };
    }
    try {
      await interaction.reply({embeds: [remindersEmbed], ephemeral: false});
    } catch (error) {
      error_handler(interaction, error);
    }
  }
}

async function remindUser(reminderObject){
  let remindMessage = `Reminder!\n ${reminderObject['reminderMessage']}`;
  let disUser = await client.users.fetch(reminderObject['discordID']);
  await disUser.send(remindMessage);
  await database.deleteItem("ReminderTable", 
    reminderObject['reminderID']).catch((err)=>console.error(err));

    setReminderTimeout();
}

//////////////////////////////////////////////////////////////////////////////////////////
// Notes Table section                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////

async function addNote(interaction) {
  let userID = interaction.user.id;
  let message = await interaction.options.getString("message");

  let time = Date.now();

  let userRegistered = await checkUserRegistered(interaction,userID);
  if (userRegistered) {
    let returnID = await database.insertData("NotesTable", [userID, message, time]).catch((e) => {interaction.reply(`addNote failed due to error: ${e}`)});
    interaction.reply(`Added Note ${returnID}`);
  }
}

async function deleteNote(interaction) {
  let userID = interaction.user.id;
  let noteID = await interaction.options.getNumber("noteid");
  
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let changes = await database.deleteItem("NotesTable", noteID).catch(
      (err)=>error_handler(interaction, err)
    );
    if (changes === 0) {
      interaction.reply("No such note exists");
    } else {
      interaction.reply(`Note ${noteID} deleted`);
    }
  }
}

async function getNote(interaction) {
  let userID = interaction.user.id;
  let noteID = await interaction.options.getNumber("noteid");

  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let resultNote = await database.findNotes(noteID, userID).catch(
      ()=>interaction.reply("Error grabbing note from database")
    );
    if (resultNote === undefined) {
        interaction.reply("No such note exists");
    } else {
        interaction.reply(`Note ${noteID}: ${resultNote["noteMessage"]}`);
    }
  }
}

async function findNotes(interaction) {
  let userID = interaction.user.id;
  let noteMessage = await interaction.options.getString("message");

  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let resultNotes = await database.findNotes(userID, noteMessage).catch(
      (err) => {
        interaction.reply("Error occured while searching for notes");
        console.error(err);
      }
    );
    if (resultNotes === undefined) {
        interaction.reply("No notes found");
    } else {
      const notesEmbed = new MessageEmbed()
      .setColor('#0dbadc')
      .setTitle('Notes Search Results')
      .setDescription(interaction.member.displayName + `\'s results`)
      .setTimestamp();
      for(var note of resultNotes) {
        try { notesEmbed.addField("Note ID: " + note['noteID'].toString(), note['noteMessage'] , false); }
        catch (error) {error_handler(interaction, error)};
      }
      try {
        await interaction.reply({embeds: [notesEmbed], ephemeral: false});
      } catch (error) {
        error_handler(interaction, error);
      }
    }
  }
}

// getting a list of noteIDs that are under one user
async function getAllNotes(interaction) {
  let userID = interaction.user.id;
  let userRegistered = await checkUserRegistered(interaction, userID);
  if (userRegistered) {
    let noteResults = await database.findNotes(userID);

    const notesEmbed = new MessageEmbed()
    .setColor('#0dbadc')
    .setTitle(interaction.member.displayName + '\'s Notes')
    .setTimestamp();
    for(var note of noteResults) {
      try { notesEmbed.addField("Note ID: " + note['noteID'].toString(), note['noteMessage'] , false); }
      catch (error) {error_handler(interaction, error)};
    }
    try {
      await interaction.reply({embeds: [notesEmbed], ephemeral: false});
    } catch (error) {
      error_handler(interaction, error);
    }

    // interaction.reply(noteResults.map((rows) => rows['noteID']).toString());
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////
// user table section                                                                         //
////////////////////////////////////////////////////////////////////////////////////////////////

// old header: async function registerUser(interaction, userID, nickname, canvasToken) {
async function registerUser(interaction) {
  let userID = interaction.user.id;
  // let nickname = await interaction.options.getMessage("nickname");
  // let canvasToken = await interaction.options.getMessage("nickname");
  
  let userRegistered = await database.getUserRow(userID)
    .catch((err)=>error_handler(interaction, err));
  if (userRegistered == undefined) {
    database.insertData("UserTable", [userID, "nickname", "token"]).catch((e) => interaction.reply(`Registration Failed with Error ${e}`));
    interaction.reply("Your account has been registered!");
  } else {
    interaction.reply("You're already registered.");
  }
}

async function checkUserRegistered(interaction,discordID) {
  if(await database.getUserRow(discordID).catch((err)=>{
    interaction.reply("An error occured checking user registration");
    console.error(err);
  }) == undefined) {
    interaction.reply(`Please register with /register first!`);
    return false;
  }
  return true;
}

async function deregister(interaction) {
  let userID = interaction.user.id;
  if(await database.getUserRow(discordID) == undefined) {
    interaction.reply("You're not even registered!");
    return;
  }
  let result = await database.removeUserData(userID);
  interaction.reply("Your account has been deregistered :(");
}

async function setTimeZone(interaction) {
  let userID = interaction.user.id;
  let tzString = await interaction.options.getString("timezone");
  if(isValidTimezone(tzString)) {
    let tzUpdateResult;
    try{
      tzUpdateResult = await database.modifyTimezone(userID, tzString)
      interaction.reply("Successfully set your timezone to " + tzString);
    } catch (e){
      error_handler(interaction, e);
      return;
    }
  } else {
    interaction.reply(tzString + " is an invalid timezone string");
  }
}

function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, {timeZone: tz});
    return true;
  } catch (ex) {
    console.error(ex);
    return false;
  }
}

function error_handler(interaction, e) {
  interaction.reply({
    content: `An Error Occured Executing That Command`,
    ephemeral: true});
  console.error(e);
}

client.login(process.env.BOT_PRIVATE);
