//imports
const { MessageEmbed } = require('discord.js');
const {checkUserRegistered, errorHandler} = require('../../helpers.js');
const database = require("../../database.js");

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getUserName(domain,token) {
  let result = await fetch(`${domain}/api/v1/users/self/profile`, {
    method: 'GET', 
    headers: {
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    }
  });

  result = await result.json(); 
  if(result['errors']) {
    throw new Error(result['errors']?.[0]['message']);
  }
  return result['name'];
}

async function getCourses(domain,token) {
  let result = await fetch(`${domain}/api/v1/users/self/courses?` 
    + new URLSearchParams({
      'include[]': 'total_scores',
      'enrollment_state': 'active'}), 
    {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json'
    }
  });

  result = await result.json();

  if(result['errors']) {
    throw new Error(result['errors']?.[0]['message']);
  }
  
  return result.map(course => {
    let grade = course['enrollments'][0]['computed_current_score'];
    grade = (grade === null)? 'N/A': (grade === undefined)? 'Hidden': grade;
    
    return {
      'name': course['name'],
      'grade': grade
    };
  });
}

// getting a list of courses that are under one user
async function getActiveClasses(interaction) {
  let userID = interaction.user.id;
  try{
    let userRegistered = await checkUserRegistered(interaction, userID);
    if (userRegistered) {
      let { canvasToken, canvasDomain } = await database.getCanvasToken(userID);
      if(!canvasToken) {
        interaction.reply("There is no Canvas account associated with your Discord account!");
        return;
      }

      let canvasName = await getUserName(canvasDomain, canvasToken);
      const coursesEmbed = new MessageEmbed()
      .setColor('#0dbadc')
      .setTitle(canvasName + '\'s Courses')
      .setTimestamp();
        let coursesResult = await getCourses(canvasDomain, canvasToken);
        if(coursesResult == -1) {
          interaction.reply("Canvas token has expired, please log in again.");
          return;
        }

        for(var course of coursesResult) {
            console.log(course);
            coursesEmbed.addField(course['name'], `Grade: ${course['grade']}`, false); 
            // coursesEmbed.addField(`Course Name:`, course, false); 
        }
        await interaction.reply({embeds: [coursesEmbed], ephemeral: false});
      }
    } 
    catch (error) {
      errorHandler(interaction, error);
    }

  }

module.exports = {
  name:'getactiveclasses',
  description: 'Displays all active class from the user canvas',
  async execute(interaction) {
    getActiveClasses(interaction);
  },
};