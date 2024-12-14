const { Client, IntentsBitField, Routes, REST, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');

const SpotifyWrapper = require('./helpers/spotifyWrapper');
const AppleMusicWrapper = require('./helpers/appleWrapper');
const YoutubeWrapper = require('./helpers/youtubeWrapper');
const { isSpotifyLink, isAppleMusicLink } = require('./helpers/linkUtil');
const { IMODIFIER, INSULT } = require('./data/insults');
const { CMODIFIER, COMPLIMENT } = require('./data/compliments');
const { CALCULATIONS } = require('./data/arguments');
const ImageMaker = require('./helpers/imageMaker');

const fs = require("fs");

// ############################
// Initial Setup
//#############################

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const VISIBLE_CHANNEL_IDS = process.env.VISIBLE_CHANNEL_IDS.split(',');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ]
});

const rest = new REST({version: '10'}).setToken(DISCORD_TOKEN);

client.once('ready', (c) => {
    console.log(`${c.user.tag} Loaded!`);
    setInterval(async () => {
      const channelId = VISIBLE_CHANNEL_IDS[Math.floor(Math.random()*VISIBLE_CHANNEL_IDS.length)];
      const channel = client.channels.cache.get(channelId);
      if (!!channel && Math.floor(Math.random() * 10) === 0) {
        await doChristmasStuff(channel);
      }
    }, 600000);
});

async function doChristmasStuff(channel) {
  console.log(`sending gift in channel ${channel.id}`);
  const modifier = Math.floor(Math.random() * 100);
  let intro;
  let message;
  if (modifier < 50) {
    intro = new ButtonBuilder()
      .setCustomId('basic-gift')
      .setLabel('Claim Gift!')
      .setStyle(ButtonStyle.Primary);
    message = "🎁 You've found a basic gift! (worth 1 point)";
  } else if(modifier < 90) {
    intro = new ButtonBuilder()
      .setCustomId('special-gift')
      .setLabel('Claim Gift!')
      .setStyle(ButtonStyle.Primary);
    message = "💝 You've found a special gift!! (worth 5 points)";
  } else {
    intro = new ButtonBuilder()
      .setCustomId('santa')
      .setLabel('Claim Gift!')
      .setStyle(ButtonStyle.Primary);
    message = "🎅 You've found Santa and helped him collect some gifts. He rewards you with a super gift!!! (worth 10 points)";
  }
  const row = new ActionRowBuilder()
    .addComponents(intro);

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('A Christmas Gift Has Appeared!!')
    .setDescription(message)
    .setTimestamp()
  channel.send({
    embeds: [embed],
    components: [row]});
}

async function updateChristmasScore(interaction, score) {
  const user = interaction.member.user;
  console.log(`${user} claimed an gift worth ${score}`);
  await interaction.update({
    content: 'Gift has been claimed',
    embeds: [],
    components: [],
  });
  fs.readFile("christmasData.json", (error, data) => {
    if (error) {
      console.error(error);
      return;
    }

    const jsonData = JSON.parse(data);
    if (jsonData[user.username] !== undefined) {
      jsonData[user.username] = jsonData[user.username] + score;
    } else {
      jsonData[user.username] = score;
    }
    fs.writeFile("christmasData.json", JSON.stringify(jsonData), (error) => {
      if (error) {
        console.error(error);
      }
    });
  });
}

async function setupCommands() {
  const commands = [{
    name: 'getvid',
    description: 'Return the first Youtube video that matches your search query',
    options: [{
      name: 'query',
      description: 'Search query for youtube',
      type: 3,
      required: true,
    }],
  }, {
    name: 'bully',
    description: 'Bully a user',
    options: [{
      name: 'victim',
      description: 'User to bully',
      type: 6,
      required: true,
    }],
  }, {
    name: 'compliment',
    description: 'Compliment a user',
    options: [{
      name: 'user',
      description: 'User to compliment',
      type: 6,
      required: true,
    }],
  }, {
    name: 'quote',
    description: 'Generate a quote image',
    options: [{
      name: 'author',
      description: 'Quote Author',
      type: 6,
      required: true,
    }, {
      name: 'quote',
      description: 'The Quote',
      type: 3,
      required: true,
    }, {
      name: 'contextpre',
      description: 'Add Context to the quote, appears before quote',
      type: 3,
      required: false,
    }, {
      name: 'contextpost',
      description: 'Add Context to the quote, appears after quote',
      type: 3,
      required: false,
    }],
  }, {
    name: 'end-argument',
    description: 'End an argument by letting me pick the winner',
    options: [{
      name: 'user',
      description: 'User you are arguing with',
      type: 6,
      required: true,
    }],
  }, {
    name: 'ping',
    description: 'Check if bot is up',
  }, {
    name: 'christmas-scoreboard',
    description: 'See the top 10 current scores in the Christmas Gift Hunt',
  }, {
    name: 'christmas-score',
    description: 'See your current score in the Christmas Gift Hunt',
  }];

  await rest.put(Routes.applicationCommands(DISCORD_APP_ID), {
    body: commands,
  });
  // FOR GUILD SPECIFIC COMMANDS
  // await rest.put(Routes.applicationCommands(DISCORD_APP_ID, '1007284487358513183'), {
  //   body: gayborCommands,
  // });
}

setupCommands();

client.login(DISCORD_TOKEN);

// ############################
// Functionality
//#############################

client.on('interactionCreate', async (interaction) => {
  if (interaction.commandName === 'getvid') {
    const query = interaction.options.getString('query');
    console.log(`/getvid: ${query} - from: ${interaction.user.username}`);
    try {
      const youtubeWrapper = new YoutubeWrapper();
      const youtubeLink = await youtubeWrapper.getVideoLinkForQuery(query);
      interaction.reply({
        content: youtubeLink,
      });
    } catch (err) {
      console.log(err);
      interaction.reply({
        content: 'OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(There was an issue with the youtube API)',
      });
      return;
    }
  }
  if (interaction.commandName === 'bully') {
    const victim = interaction.options.getUser('victim');
    console.log(`${interaction.user.username} is bullying ${victim.username}`);
    if (victim.username === process.env.MY_USERNAME) {
      interaction.reply({
        content: `${victim} is a perfect angel, leave him alone`
      });
      return;  
    }
    const modifier = IMODIFIER[Math.floor(Math.random()*IMODIFIER.length)];
    const insult = INSULT[Math.floor(Math.random()*INSULT.length)];
    interaction.reply({
      content: `${victim} you ${modifier} ${insult}`
    });
  }
  if (interaction.commandName === 'compliment') {
    const user = interaction.options.getUser('user');
    console.log(`${interaction.user.username} is complimenting ${user.username}`);
    if (user.username === process.env.DOMS_USERNAME) {
      interaction.reply({
        content: `Unfortunately i can't think of anything nice to say about ${user}. Are you sure you didn't mean to /bully them?`
      });
      return;  
    }
    const modifier = CMODIFIER[Math.floor(Math.random()*CMODIFIER.length)];
    const compliment = COMPLIMENT[Math.floor(Math.random()*COMPLIMENT.length)];
    interaction.reply({
      content: `${user} you ${modifier} ${compliment}`
    });
  }
  if (interaction.commandName === 'end-argument') {
    const user = interaction.options.getUser('user');
    const op = interaction.user;
    let winner;
    if (Math.random() >= 0.5) {
      winner = user;
    } else {
      winner = op;
    }
    if (op.username === process.env.DOMS_USERNAME) {
       winner = user;
    } else if (user.username === process.env.DOMS_USERNAME) {
      winner = op;
    }
    if (user.username === process.env.MY_USERNAME) {
      winner = user;
   } else if (op.username === process.env.MY_USERNAME) {
     winner = op;
   }
    console.log(`${op.username} is arguing with ${user.username} and ${winner.username} is winning`);
    const calc = CALCULATIONS[Math.floor(Math.random()*CALCULATIONS.length)];
    interaction.reply({
      content: `${calc} I've decided that ${winner} is correct. Now please stop arguing and do something productive with your time.`
    });
  }
  if (interaction.commandName === 'quote') {
    const author = interaction.options.getUser('author');
    let quote = interaction.options.getString('quote');
    let contextPre = interaction.options.getString('contextpre');
    let contextPost = interaction.options.getString('contextpost');
    quote = '"' + quote + '"';
    const fullAuthor = await interaction.client.users.fetch(author.id);
    let avatarUrl = fullAuthor.avatarURL({size: 256});
    // using {imageExtension: 'png'} didnt work for some reason so manually doing here
    avatarUrl = avatarUrl.replace('.webp', '.png');
    avatarUrl = avatarUrl.replace('.gif', '.png');
    avatarUrl = avatarUrl.replace('.jpeg', '.png');
    avatarUrl = avatarUrl.replace('.jpg', '.png');
    const imageMaker = new ImageMaker();
    const quoteLines = imageMaker.getLinesFromInput(quote, false);
    const contextPreLines = imageMaker.getLinesFromInput(contextPre, true);
    const contextPostLines = imageMaker.getLinesFromInput(contextPost, true);
    const authorLine = ['- ' + author.username];
    // const finalLines = [...contextPreLines, ...quoteLines, ...contextPostLines, '- ' + author.username];
    const filePath = imageMaker.getFilePath();
    try {
      await imageMaker.makeImage(avatarUrl, contextPreLines, quoteLines, contextPostLines, authorLine, filePath);
      await interaction.reply({
        files: [new AttachmentBuilder(filePath)]
      })
      imageMaker.deleteQuoteImage(filePath);
    } catch (err) {
      console.log(err)
    }
  }
  if (interaction.commandName === 'christmas-score') {
    fs.readFile("christmasData.json", async (error, data) => {
      if (error) {
        console.error(error);
        return;
      }

      const jsonData = JSON.parse(data);
      const username = interaction.user.username;
      let message;
      if (jsonData[username] !== undefined) {
        message = 'Your current score is ' + jsonData[username];
      } else {
        message = 'You have not collected any gifts yet';
      }
      await interaction.reply({
        content: message
      });
    });
  }

  if (interaction.commandName === 'christmas-scoreboard') {
    fs.readFile("christmasData.json", async (error, data) => {
      if (error) {
        console.error(error);
        return;
      }

      const jsonData = JSON.parse(data);

      let sortable = [];
      for (let username in jsonData) {
          sortable.push([username, jsonData[username]]);
      }

      let message = '';
      if (sortable.length === 0) {
        message = 'Nobody has claimed any gifts yet :(';
      } else {
        sortable.sort((a, b) => {
            return  b[1] - a[1];
        });


        sortable.slice(0, 10).forEach((value, index) => {
          message += `${index + 1}) ${value[0]} - ${value[1]}\n`
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Christmas Gift Hunt Scoreboard')
        .setDescription(message);

      await interaction.reply({
        embeds: [embed]
      });
    });
  }
  if (interaction.customId === 'basic-gift') await updateChristmasScore(interaction, 1);
  if (interaction.customId === 'special-gift') await updateChristmasScore(interaction, 5);
  if (interaction.customId === 'santa') await updateChristmasScore(interaction, 10);
  if (interaction.commandName === 'ping') {
    await interaction.reply({
      content: 'pong',
    });
  }
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  let wrapper = null;
  if (isSpotifyLink(message.content)) {
    wrapper = new SpotifyWrapper();
  } else if (isAppleMusicLink(message.content)) {
    wrapper = new AppleMusicWrapper();
  }
  if (wrapper !== null) {
    await doMusicThing(wrapper, message);
    return;
  };
  if (message.author.username === process.env.TIVS_USERNAME) {
    await sendTivCrazyFrog(message);
    return;
  }
});

async function doMusicThing(wrapper, message) {
  let query = null;
  try {
    await wrapper.getYoutubeSearchQueryForMessage(message).then((q) => {
      query = q;
    });
  } catch (err) {
    console.log(err);
    message.channel.send(`OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(${err.message})`);
    return;
  }
  if (query == null) {
    return;
  }
  if (query === '') {
    console.log(`Failed query build: ${message.content} - User: ${message.author.username}`);
    message.channel.send("OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(I couldn't find what you were looking for)");
    return;
  }
  try {
    const randInt = Math.floor(Math.random() * 500);
    if (randInt === 420 || randInt === 69) {
      message.channel.send('Ew, get better taste...');
    }
    const youtubeWrapper = new YoutubeWrapper();
    console.log(`Fetching query: ${query} - User: ${message.author.username}`);
    const youtubeLink = await youtubeWrapper.getVideoLinkForQuery(query);
    message.channel.send(youtubeLink);
  } catch (err) {
    console.log(err);
    message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(There was an issue with the youtube API)');
    return;
  }
}

async function sendTivCrazyFrog(message) {
  if (Math.floor(Math.random() * 500) === 0) {
    await message.channel.send({
      content: `Hey ${message.author} did you know that crazy frog used to have a penis?`,
      files: [new AttachmentBuilder('./images/crazy_frog.png')]
    });
  }
}