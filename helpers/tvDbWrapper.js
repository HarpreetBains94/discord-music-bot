const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const youtubesearchapi = require("youtube-search-api");

const TV_DB_API_KEY = process.env.TV_DB_API_KEY;
const URL_BASE = 'https://api4.thetvdb.com/v4';

var accessToken = '';

// TODO clean up

module.exports = class TvDbWrapper {
  login() {
    return axios.post(URL_BASE + '/login', {
        apikey: TV_DB_API_KEY
      }
    ).catch((err) => {
      console.log('failed to get TVDB token', err);
      throw new Error('Failed to renew TVDB token');
    })
  }

  async getEmbed(query) {
    return this.getSynopsisData(query).then((data) => {
      const embed = new EmbedBuilder()
        .setTitle(data.tvDbData.extended_title)
        .setAuthor({ name: 'Data sourced from TheTVTB', url: 'https://www.thetvdb.com/' })
        .setDescription(`Genres: ${data.tvDbData.genres.join(', ')}\n\n${data.tvDbData.overviews['eng'] || ''}`);
        return {
          embed,
          trailer: data.trailer,
        };
    }).catch((err) => {
      throw err;
    });
  }

  async getSynopsisData(query) {
    const tokenResponse = await this.login();
    const movieDataResponse = await axios.get(`${URL_BASE}/search?query=${encodeURIComponent(query)}`, {
      headers: `Authorization: Bearer ${tokenResponse.data.data.token}`
    }).catch((err) => {
      console.log('TVDB search request failed', err);
      throw new Error('TVDB search request failed');
    });

    if (movieDataResponse.status !== 200) {
      throw new Error('TVDB search request failed');
    }
    if (movieDataResponse.data.data.length === 0) {
      throw new Error('TVDB search returned no results');
    }
    
    const tvDbData = movieDataResponse.data.data[0];

    const trailerData = await youtubesearchapi.GetListByKeyword(query + ' trailer', false, 1, {}).catch((err) => {
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