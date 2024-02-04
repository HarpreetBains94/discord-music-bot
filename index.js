const { Client, IntentsBitField, Routes, REST, AttachmentBuilder } = require('discord.js');

const SpotifyWrapper = require('./helpers/spotifyWrapper');
const AppleMusicWrapper = require('./helpers/appleWrapper');
const YoutubeWrapper = require('./helpers/youtubeWrapper');
const { isSpotifyLink, isAppleMusicLink } = require('./helpers/linkUtil');
const { IMODIFIER, INSULT } = require('./data/insults');
const { CMODIFIER, COMPLIMENT } = require('./data/compliments');
const { CALCULATIONS } = require('./data/arguments');
const ImageMaker = require('./helpers/imageMaker');

// ############################
// Initial Setup
//#############################

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;

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
});

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
  }];

  await rest.put(Routes.applicationCommands(DISCORD_APP_ID), {
    body: commands,
  })
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
    quote = '"' + quote + '"';
    const fullAuthor = await interaction.client.users.fetch(author.id);
    let avatarUrl = fullAuthor.avatarURL({size: 256});
    // using {imageExtension: 'png'} didnt work for some reason so manually doing here
    avatarUrl = avatarUrl.replace('.webp', '.png');
    avatarUrl = avatarUrl.replace('.gif', '.png');
    avatarUrl = avatarUrl.replace('.jpeg', '.png');
    avatarUrl = avatarUrl.replace('.jpg', '.png');
    const quoteLines = [];
    let currentLine = 0;
    quote.split(' ').forEach((word, index) => {
      if (index === 0) {
        quoteLines[currentLine] = word
      } else if (quoteLines[currentLine].length < 30) {
        quoteLines[currentLine] = quoteLines[currentLine] + ' ' + word;
      } else {
        currentLine++;
        quoteLines[currentLine] = word;
      }
    });
    quoteLines.push('- ' + author.username);
    const imageMaker = new ImageMaker();
    const filePath = imageMaker.getFilePath();
    try {
      await imageMaker.makeImage(avatarUrl, quoteLines, filePath);
      await interaction.reply({
        files: [new AttachmentBuilder(filePath)]
      })
      imageMaker.deleteQuoteImage(filePath);
    } catch (err) {
      console.log(err)
    }
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
  if (messageReferencesPoland(message)) {
    await annoyBort(message);
    return;
  }
  if (message.author.username === process.env.JINS_USERNAME) {
    await callJinASwiftie(message);
    return;
  }
  if (message.author.username === process.env.DAMIANS_USERNAME) {
    const modifier = IMODIFIER[Math.floor(Math.random()*IMODIFIER.length)];
    const insult = INSULT[Math.floor(Math.random()*INSULT.length)];
    await message.channel.send({
      content: `${message.author.username} you ${modifier} ${insult}`
    });
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

function messageReferencesPoland(message) {
  if (message.author.username !== process.env.BORTEKS_USERNAME) {
    return false;
  }
  return ['poland', 'krakow', 'kraków', 'polish', 'kurwa'].some(word => message.content.toLocaleLowerCase().includes(word));
}

async function annoyBort(message) {
  await message.channel.send({
    files: [new AttachmentBuilder('./images/polan.png')]
  });
}

async function callJinASwiftie(message) {
  if (Math.floor(Math.random() * 50) === 0) {
    await message.channel.send({
      content: `${message.author} this u?`,
      files: [new AttachmentBuilder('./images/swiftie.png')]
    });
  }
}