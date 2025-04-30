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
    )
  }

  async getEmbed(query) {
    const data = await(this.getSynopsisData(query));
    const embed = new EmbedBuilder()
      .setTitle(data.tvDb.extended_title)
      .setAuthor({ name: 'Data sourced from TheTVTB', url: 'https://www.thetvdb.com/' })
      .setDescription(`Genres: ${data.tvDb.genres.join(', ')}\n\n${data.tvDb.overviews['eng'] || ''}`);
      return {
        embed,
        trailer: data.trailer,
      };
  }

  async getSynopsisData(query) {
    return this.login().then((response) => {
      console.log('success', response.data.data)
      return axios.get(`${URL_BASE}/search?query=${encodeURIComponent(query)}`, {
        headers: `Authorization: Bearer ${response.data.data.token}`
      }).then((response) => {
        if (response.status !== 200) {
          throw new Error('TVDB search request failed');
        }
        if (response.data.data.length === 0) {
          throw new Error('TVDB search returned no results');
        }
        const tvDbData = response.data.data[0];

        return youtubesearchapi.GetListByKeyword(query + ' trailer', false, 1, {})
          .then((res) => {
            var trailer = '';
            if (res && res.items && res.items.length !== 0) {
              trailer = `https://www.youtube.com/watch?v=${res.items[0].id}`;
            }
    
            return {
              tvDb: tvDbData,
              trailer: trailer,
            };
          })
          .catch((err) => {
            console.log('failed to fetch movie trailer', err)
            throw new Error('Failed to fetch movie trailer');
          });

      }).catch((err) => {
        console.log('in err');
        console.log(err);
      });
    }).catch((err) => {
      console.log('failed to get tvdb token', err);
      throw new Error('Failed to renew tvdb token');
    });
  }
}