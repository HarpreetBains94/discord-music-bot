const fetch = require('isomorphic-unfetch')
const { getData } = require('spotify-url-info')(fetch)

module.exports = class SpotifyWrapper {
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