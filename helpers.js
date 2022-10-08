const fs = require('fs');
const path = require('path');
const database = require("./database.js");
const { MessageEmbed } = require('discord.js');

const dateFormat = (timezone)=> 
  new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    year: 'numeric',
  })
;

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  })

  return arrayOfFiles;
}

async function errorHandler(interaction, e) {
  console.error(e);
  await interaction.reply({
    content: `There was an error while executing this command\n${e}`,
    ephemeral: true});
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

var currentReminder;

async function setReminderTimeout(client) {
  // doing setTimeOut for the next reminder check
  if (currentReminder != null)
  clearTimeout(currentReminder);

  // get the earliest reminder
  let earliestReminder = await database.getLatestReminder().catch(
    (err)=>console.error("Error getting latest reminder:" + err));
  if(earliestReminder !== undefined){
    let time = Date.now();
    time = earliestReminder['notifyTime'] - time;
    if (time <= 0)
      await remindUser(earliestReminder, client);
    else
      currentReminder = runAtDate(async function() {
        await remindUser(earliestReminder, client);
      }, time);
  } else
    currentReminder = null;
}

function runAtDate(func, reminderTime) {
  if (reminderTime > 0x7FFFFFFF) //setTimeout limit is MAX_INT32=(2^31-1)
      return setTimeout(function() {runAtDate(func, reminderTime);}, 0x7FFFFFFF);
  else
      return setTimeout(func, reminderTime);
}

async function remindUser(reminderObject, client){
  try {
    let discordUser = await client.users.fetch(reminderObject['discordID']);
    let userResults = await database.getUserRow(reminderObject['discordID']);
    let reminderEmbed = new MessageEmbed()
      .setColor('#0dbadc')
      .setTitle(discordUser.username + '\'s Reminder')
      .setTimestamp();

    console.log(reminderObject['reminderMessage']);
    let remindDate = dateFormat(userResults['timezone'])
      .format(new Date(reminderObject['notifyTime']));
      reminderEmbed.addField("Reminder ID: " + reminderObject['reminderID'].toString(),
        "When: " + remindDate + 
        "\nMessage: " + reminderObject['reminderMessage'].toString(), false); 

    await discordUser.send({embeds: [reminderEmbed]});
    await database.deleteItem("ReminderTable", reminderObject['reminderID']);
    setReminderTimeout(client);
  } catch (error) {
    console.error(error);
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

module.exports = {
  getAllFiles,
  errorHandler,
  checkUserRegistered,
  setReminderTimeout,
  dateFormat,
  isValidTimezone
}
