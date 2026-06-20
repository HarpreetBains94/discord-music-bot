const { EmbedBuilder } = require('discord.js');
const youtubesearchapi = require("youtube-search-api");

const TV_DB_API_KEY = process.env.TV_DB_API_KEY;
const URL_BASE = 'https://api4.thetvdb.com/v4';

module.exports = class TvDbWrapper {
  getToken() {
    return fetch(URL_BASE + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apikey: TV_DB_API_KEY
        })
      }
    ).then((response) => response.json())
    .then((data) => data.data.token)
    .catch((err) => {
      console.log('Failed to get TVDB token', err);
      throw new Error('Failed to renew TVDB token');
    })
  }

  async getEmbed(query, year) {
    return this.getSynopsisData(query, year).then((data) => {
      const embed = new EmbedBuilder()
        .setTitle(data.tvDbData.extended_title)
        .setAuthor({ name: 'Data sourced from TheTVTB', url: 'https://www.thetvdb.com/' })
        .setDescription(`Genres: ${data.tvDbData.genres.join(', ')}\n\n${data.tvDbData.overviews?.eng || ''}`);
        return {
          embed,
          trailer: data.trailer,
        };
    }).catch((err) => {
      throw err;
    });
  }

  async getSynopsisData(query, year) {
    const token = await this.getToken();
    const tvDbData = await fetch(`${URL_BASE}/search?query=${encodeURIComponent(query)}${year ? '&year=' + encodeURIComponent(year) : ''}&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((response => {
      if (!response.ok) {
        throw new Error('Response not ok');
      }
      return response.json()
    })).then((data) => {
      if (data.data.length === 0) {
        throw new Error('TVDB search returned no results');
      }
      return data.data[0];
    }).catch((err) => {
      console.log('TVDB search request failed', err);
      throw new Error('TVDB search request failed');
    });

    const trailerData = await youtubesearchapi.GetListByKeyword(tvDbData.extended_title + ' trailer', false, 1, {}).catch((err) => {
      console.log('Failed to fetch movie trailer', err)
      throw new Error('Failed to fetch movie trailer');
    });

    var trailer = '';
    if (trailerData && trailerData.items && trailerData.items.length !== 0) {
      trailer = `https://www.youtube.com/watch?v=${trailerData.items[0].id}`;
    }

    return {
      tvDbData,
      trailer,
    };
  }
}