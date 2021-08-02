const Discord = require('discord.js');
const client = new Discord.Client();
require('dotenv').config();
client.on('ready', () => {
    console.log("n/a");
});
  
client.on('message', msg => {
    if (msg.content === 'pencil') {
      msg.reply('sharpener!');
    }
});
  
client.login(process.env.BOT_PRIVATE);

//console.log("I am commenting my thingy: ",process.env.BOT_PRIVATE);

