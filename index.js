const { Client, IntentsBitField, Events } = require('discord.js');
const fetch = require('isomorphic-unfetch')
const { getData } = require('spotify-url-info')(fetch)
const youtubesearchapi = require("youtube-search-api");

class SpotifyWrapper {
  async getYoutubeSearchQueryForMessage(message) {
    const data = await this.getTrackData(message.content);
    if (!data || !data.title || !data.artists || data.artists.length === 0) {
      return 'Invalid search query';
    }
    let query = data.title;
    data.artists.forEach((artist) => {
      query += ` ${artist.name}`;
    });
    return new Promise((resolve) => {
      resolve(query);
    })
  }

  async getTrackData(link) {
    return await getData(link);
  }
}

class AppleMusicWrapper {
  async getYoutubeSearchQueryForMessage(message) {
    // wait for discord to embed apple link and get the metadata from that
    // im not paying apple for an api for this dumb bot
    message.channel.send('Give me a sec, I\'m trying to avoid paying apple')
    return new Promise((resolve) => {
      setTimeout(async () => {
        const messageWithEmbed = await message.channel.messages.fetch(message.id);
        if (!messageWithEmbed || !messageWithEmbed.embeds || messageWithEmbed.embeds.length === 0) {
          resolve('Invalid search query');
        } else {
          resolve(messageWithEmbed.embeds[0].title);
        }
      }, 5000)
    })
  }

  async getTrackData(link) {
    return await appleMusic(link);
  }
}

class YoutubeWrapper {
  async getVideoLinkForQuery(query) {
    const data = await youtubesearchapi.GetListByKeyword(query, false, 1, {});
    if (!data || !data.items || data.items.length === 0) {
      return `Unable to find video for query: ${query}`;
    }
    return `https://www.youtube.com/watch?v=${data.items[0].id}`;
  }
}

class LinkUtil {
  isAppleMusicLink(maybeLink) {
    return maybeLink.includes('music.apple.com');
  }

  isSpotifyLink(maybeLink) {
    return maybeLink.includes('open.spotify.com');
  }
}

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ]
});

client.once('ready', (c) => {
    console.log(`${c.user.tag} Loaded!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }
  const youtubeWrapper = new YoutubeWrapper();
  const linkUtil = new LinkUtil();
  let wrapper = null;
  let query = '';
  if (message.content.split(' ')[0] === '!getvid') {
    query = message.content.split(' ').slice(1).join(' ');
  } else {
    if (linkUtil.isSpotifyLink(message.content)) {
      wrapper = new SpotifyWrapper();
    } else if (linkUtil.isAppleMusicLink(message.content)) {
      wrapper = new AppleMusicWrapper();
    }
  }
  if (wrapper !== null) {
    try {
      await wrapper.getYoutubeSearchQueryForMessage(message).then((q) => {
        query = q;
      });
    } catch (err) {
      console.log(err);
      message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky');
      return;
    }
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
    console.log(`Fetching query: ${query} - User: ${message.author.username}`);
    const youtubeLink = await youtubeWrapper.getVideoLinkForQuery(query);
    message.channel.send(youtubeLink);
  } catch (err) {
    console.log(err);
    message.channel.send('OOPSIE WOOPSIE!! Uwu we made a fucky wucky');
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);