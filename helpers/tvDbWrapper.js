const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const youtubesearchapi = require("youtube-search-api");

const TV_DB_API_KEY = process.env.TV_DB_API_KEY;
const URL_BASE = 'https://api4.thetvdb.com/v4';

var accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2UiOiIiLCJhcGlrZXkiOiIwNzZjMWQyOS03YjhjLTRlY2UtYTY4Ni0xMjQ0ZThhZDU0OWEiLCJjb21tdW5pdHlfc3VwcG9ydGVkIjpmYWxzZSwiZXhwIjoxNzQ4NTk1NjMxLCJnZW5kZXIiOiIiLCJoaXRzX3Blcl9kYXkiOjEwMDAwMDAwMCwiaGl0c19wZXJfbW9udGgiOjEwMDAwMDAwMCwiaWQiOiIyODA2NjUwIiwiaXNfbW9kIjpmYWxzZSwiaXNfc3lzdGVtX2tleSI6ZmFsc2UsImlzX3RydXN0ZWQiOmZhbHNlLCJwaW4iOm51bGwsInJvbGVzIjpbXSwidGVuYW50IjoidHZkYiIsInV1aWQiOiIifQ.mWAhU5G9kyFv992PHQQMVLIJiqiZnl7kpfIAHG0dbGvmfydWamqWGV56pDWcHWh50jc2L9czBC-cW6kvFOmQ_cxQ0oTLycN8r1oU-5F8yCR6r8SWaxrHsYDhvffJruyT_dDY3lMN_nbh3hevShOiXr8TIJODu9eyLOfvIchUbXv3QQjzbhAZWdtVUEGwGnEIFPO5K7Ey_TRm6aYJX-95Vq7aVUVQnBpBmBEkVEz_RBIiPYDjRH7VF1tp3hZp35FnTA28Icdq9Io1LIDGPt2gG-1X7ZQ8UD6xWx0gY59XOYphGGZS00L4grXrkbbibOmEpn3ulBHoI9zKd8s8xVkOgL9qVWbKMrZ8ujtEKrnMgR6MbhWnEyjQr3SIwoZfOHevDLMf2T32JH_RxMClOVwDoM43BlXC9qDhNjfpW2wn_oMjJ5f9x6aCLdKAWRIPpVLj1q6QjXpJQGhrmO6ITXfTnvrZTy_EjrXW2jINQRW72pH-Ul9Jc4_yeD0AsFDEoWhnnxRL-MB7wzE_CaGbK0BsUMRT-YaWDLnjCaqFkuSj4iAxVeqIVx1WGFnKtoPBDgkD2BtliNvACf8VwMG54XFE4ptldxY5MjO4rC6253RKFz_dygUMmWkBp4hXxsprpR_4xf-8JLdXxsrPRk4tkJEA-_NQHrxwxLpYGo0vudGDSUd';

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
      .setDescription(`Genres: ${data.tvDb.genres.join(', ')}\n\n*${data.tvDb.overviews['eng'] || ''}*`);
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