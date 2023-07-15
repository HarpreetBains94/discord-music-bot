const { Client, IntentsBitField, Routes, REST } = require('discord.js');

const SpotifyWrapper = require('./helpers/spotifyWrapper');
const AppleMusicWrapper = require('./helpers/appleWrapper');
const YoutubeWrapper = require('./helpers/youtubeWrapper');
const { isSpotifyLink, isAppleMusicLink } = require('./helpers/linkUtil');

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
        content: 'OOPSIE WOOPSIE!! Uwu we made a fucky wucky',
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
    interaction.reply({
      content: `${victim} you dingus`
    });
  }
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  let wrapper = null;
  let query = null;
  if (isSpotifyLink(message.content)) {
    wrapper = new SpotifyWrapper();
  } else if (isAppleMusicLink(message.content)) {
    wrapper = new AppleMusicWrapper();
  }
  if (wrapper === null) return;
  try {
    await wrapper.getYoutubeSearchQueryForMessage(message).then((q) => {
      query = q;
    });
  } catch (err) {
    console.log(err);
    message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky');
    return;
  }
  if (query === '') {
    console.log(`Failed query build: ${message.content} - User: ${message.author.username}`);
    return;
  }
  if (query === 'Invalid search query') {
    message.channel.send(query);
    console.log(`Failed query build: ${message.content} - User: ${message.author.username}`);
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
    message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky');
    return;
  }
});