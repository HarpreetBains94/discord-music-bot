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

const MODIFIER = [
  'abnormal',
  'abstract',
  'bald headed',
  'baby faced',
  'bustling',
  'conniving little',
  'complete',
  'confirmed',
  'callous',
  'down bad',
  'dirty',
  'delirious',
  'dubious ',
  'entire',
  'egg-shaped',
  'earl grey tea drinking',
  'filty',
  'fascinating',
  'freaking',
  'ferocious',
  'horrid',
  'heely wearing',
  'heinous',
  'insubordinate',
  'inept',
  'impertinent',
  'jacked up',
  'junk faced',
  'loopy',
  'lopsided',
  'loose lipped',
  'dried up',
  'loony',
  'musty',
  'negligent',
  'notorious',
  'official',
  'organic',
  'original',
  'psychotic',
  'petulant',
  'silly',
  'resident',
  'tactless',
  'tasteless',
  'terrible',
  'textbook',
  'unemployed',
  'unusual',
  'universal',
  'value',
  'massive',
  'smelly',
  'giant',
  'stinky',
  'absolute',
  'unbelievable',
  'extreme',
  'old',
  'ancient',
  'wrinkly',
  'dumb',
  'unsophisticated',
  'fucking',
  'ignorant',
  'basic',
  'primitive',
  'ungodly',
  'unholy',
  'unrefined',
  'simple',
  'crude',
  'rudimentery',
  'undeveloped',
  'naive',
  'churlish',
  'spineless',
  'blubbering',
  'sniveling',
  'weak',
  'weeping',
  'howling',
  'inconceivable',
  'monumental',
  'enormous',
  'gigantic',
  'colossal',
  'mighty',
  'extraordinary',
  'ginormous',
  'dreadful',
  'catastrophic',
  'staggering',
  'gargantuan',
  'tremendous',
  'exceptional',
  'stupendous',
  'whopping',
  'outstanding',
  'indefensible',
  'little',
  'lil',
  'petite',
  'tiny',
  'amorphous',
  'shapeless',
  'unstructured',
  'nebulous',
  'undeniable',
  'unquestionable',
  'indisputable',
  'uncultured',
  'geriatric',
  'generic',
  'cheap',
  'broke',
  'delusional',
  'sweaty',
  'single brain-cell having',
  'defective',
  'yee yee ass',
  'broke ass',
  'unwanted',
  'bitch-less',
  'hoe-less',
  'sanctimonious',
  'obtuse',
  'widdle',
  'rotten',
  'no-good',
  'insecure',
  'junkyard',
  'delinquent',
];
const INSULT = ['dingus',
  'dweeb',
  'dork',
  'wombat',
  'doofus',
  'fool',
  'dingbat',
  'oaf',
  'nitwit',
  'ignoramus',
  'mug',
  'dipstick',
  'lump',
  'imbecile',
  'simpleton',
  'boob',
  'donkey',
  'moron',
  'nimrod',
  'ninny',
  'git',
  'cretin',
  'pinhead',
  'cunt',
  'nut',
  'ding-dong',
  'nincompoop',
  'dummy',
  'dope',
  'numbskull',
  'kucklehead',
  'dolt',
  'slut',
  'loser',
  'crackpot',
  'fathead',
  'shlub',
  'chump',
  'know-nothing',
  'bitch','laughing-stock',
  'oddball',
  'charlatan',
  'troglodyte',
  'fuck',
  'simp',
  'cock',
  'whore',
  'rat',
  'buffoon',
  'goblin',
  'clown',
  'shit',
  'dunce',
  'halfwit',
  'numpty',
  'twerp',
  'muppet',
  'dunderhead',
  'flop',
  'failure',
  'has-been',
  'noob',
  'blob',
  'homunculus',
  'cro-magnon',
  'neanderthal',
  'ed sheeran stan',
  'swiftie',
  'swine',
  'pig',
  'gremlin',
  'ass',
  'worm',
  'poop',
  'asshat',
  'asshole',
  'boot-licker',
  'tool',
  'cum-stain',
  'hoe',
  'cow','coward',
  'bastard',
  'scrub',
  'twink',
  'ape',
  'balloon',
  'cabbage',
  'cantaloupe',
  'carrot stick',
  'delinquent',
  'dumb dumb',
  'mother fucker',
  'doody head',
  'egg head',
  'fart face',
  'fart',
  'turd',
  'goofy goober',
  'goof-ball',
  'goober',
  'iPad kid',
  'jerk-off',
  'knob',
  'lame-o',
  'moocher',
  'munch',
  'maggot',
  'penguin',
  'panty sniffer',
  'pineapple head',
  'rhubarb',
  'square',
  'sick-o',
  'perv',
  'wanker'
];

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
    const modifier = MODIFIER[Math.floor(Math.random()*MODIFIER.length)];
    const insult = INSULT[Math.floor(Math.random()*INSULT.length)];
    interaction.reply({
      content: `${victim} you ${modifier} ${insult}`
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
    message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(There was an issue with the Spotify API)');
    return;
  }
  if (query === '') {
    console.log(`Failed query build: ${message.content} - User: ${message.author.username}`);
    message.channel.send("OOPSIE WOOPSIE!! Uwu we made a fucky wucky\n(I couldn't find what you were looking for)");
    return;
  }
  if (query === 'Invalid search query') {
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
});