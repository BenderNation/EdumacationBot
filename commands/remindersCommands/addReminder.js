// imports
const {checkUserRegistered, errorHandler, setReminderTimeout, isValidTimezone, dateFormat} = require('../../helpers.js');
const database = require("../../database.js");

// const insertReminderTable = "insert into ReminderTable (discordID, reminderMessage, notifyTime, timeStamp) values (?,?,?,?)";
async function addReminder(interaction, client) {
  let userID = interaction.user.id;
  if (await checkUserRegistered(interaction, userID) == false) {
    return;
  }

  let time = Date.now();
  let message = await interaction.options.getString("message");

  let inputTime = await interaction.options.getString("time");
  let inputTimeZone = await interaction.options.getString("timezone");
  if(!inputTimeZone) {
    userTimeZone = (await database.getUserRow(userID))['timezone'];
    inputTimeZone = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimeZone,
      timeZoneName: 'short'
    }).format(new Date());
    inputTimeZone = inputTimeZone.substring(inputTimeZone.length - 3);
    console.log(inputTimeZone);

  } else if(!isValidTimezone(inputTimeZone)) {
    interaction.reply(tzString + " is an invalid timezone string");
    return;
  }
  
  let inputDate = await interaction.options.getString("date");
  if(!inputDate) {

    inputDate = new Date(new Date().toLocaleString("en-US", {timeZone: inputTimeZone})).toDateString();
    inputDate = inputDate.substring(4);

  } else if(isNaN(Date.parse(inputDate))) {
    interaction.reply(inputDate + " is an invalid date string");
    return;
  }
  
  // const javaScriptRelease = Date.parse('04 Dec 1995 00:12:00 GMT');
  
  let notifyTime = Date.parse(`${inputDate} ${inputTime} ${inputTimeZone}`);
  console.log(`${inputDate} ${inputTime} ${inputTimeZone}`);

  if(isNaN(notifyTime)) {
    interaction.reply("Invalid time/date string provided");
    return;
  }
  console.log(notifyTime);

  if(notifyTime < time) {
    interaction.reply(`Reminder can not be before current time!`);
    return;
  }
  console.log(`Reminder msg: ${message} currentTime:${time} notifyTime: ${notifyTime}`);

  let returnID = await database.insertData("ReminderTable", [userID, message, notifyTime, time]).catch((e) => errorHandler(interaction, e));
  let dateString = dateFormat(inputTimeZone).format(new Date(notifyTime));
  interaction.reply(`Added Reminder ${returnID} for: \n${dateString}`);

  setReminderTimeout(client);
  
}

module.exports = {
  name:'addreminder',
  description: 'Adds a reminder to the database under user ID',
  options: [{name: 'message', type: "STRING", description: 'The reminder to save', required: true},
            {name: 'time', type: "STRING", description: 'The time to remind, format: 00:12:00', required: true},
            {name: 'date', type: "STRING", description: 'The date to remind, format: 04 Dec 1995', required: false},
            {name: 'timezone', type: "STRING", description: 'Timezone of the reminder time', required: false},],

  async execute(interaction, client) {
    addReminder(interaction, client);
  }
};