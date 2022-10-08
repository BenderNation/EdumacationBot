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
    interaction.reply("Invalid timezone string");
    return;
  }
  
  let inputDate = await interaction.options.getString("date");
  if(!inputDate) {

    inputDate = new Date(new Date().toLocaleString("en-US", {timeZone: inputTimeZone})).toDateString();
    inputDate = inputDate.substring(4);

  } else if(isNaN(Date.parse(inputDate))) {
    interaction.reply(`\"${inputDate}\" is an invalid date string`);
    return;
  }

  let inputTimeTillReminder = timeArrayParsing(inputTime);
  let notifyTime;
  if(inputTimeTillReminder < 0) {
    interaction.reply(`\"${inputTime}\" is an invalid input string`);
    return
  }
  else if (inputTimeTillReminder > 0) {
    notifyTime = inputTimeTillReminder + time;
  } else {
    notifyTime = Date.parse(`${inputDate} ${inputTime} ${inputTimeZone}`);
  }
  // console.log(`${inputDate} ${inputTime} ${inputTimeZone}`);

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

function timeArrayParsing(inputTime) {

  // maybe we can put the "in" check in front of the parsing, this way we don't get "in3s2m1hr1d" as a valid input "in 3s2m1hr1d" is fine
   


  // let timeArr = inputTime.split(" ");

  // adds a space between letters and numbers, trim the string, and then split it by whitespace.
  inputTime = inputTime.replace(/(\d+)/g, function (_, num){
      return ' ' + num + ' ';
  });
  inputTime = inputTime.trim();
  var timeArr = inputTime.split(/\s+/);

  let sumTime = 0;
  let secUsed, minUsed, hrUsed, dayUsed = false;
  if(timeArr[0] == "in") {
    let reminderTime = 0;

    for(let i = 1; i < timeArr.length - 1; i++) {
      reminderTime = parseInt(timeArr[i]);
      if (!(Number.isInteger(reminderTime) && reminderTime >= 0)) {
        return -1;
      }
      // "in 3 second 2 secs"
      switch(timeArr[i+1]) {
        case "seconds": case "second": case "secs": case "sec": case "s":
          if(secUsed) {
            return -1;
          }
          sumTime += reminderTime * 1000;
          secUsed = true;
          break;
        case "minutes": case "minute": case "mins": case "min":
          if (minUsed) {
            return -1;
          }
          sumTime += reminderTime * 60 * 1000;
          minUsed = true;
          break;
        case "hours": case "hour": case "hr":
          if (hrUsed) {
            return -1;
          }
          sumTime += reminderTime * 60 * 60 * 1000;
          hrUsed = true;
          break;
        
        case "days": case "day": case "d":
          if (dayUsed) {
            return -1;
          }
          sumTime += reminderTime * 24 * 60 * 60 * 1000;
          break;
        default:
          return -1;
      }
    }
    return sumTime;
  }
  return 0;
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