const axios = require('axios');

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = '';

module.exports = class SpotifyWrapper {
  async getYoutubeSearchQueryForMessage(message) {
    let data;
    try {
      await this.fetchNewAccessToken();
    } catch (e) {
      throw e;
    }
    try {
      data = await this.getTrackData(message.content);
    } catch (e) {
      throw e;
    }
    if (!data || !data.name || !data.artists || data.artists.length === 0) {
      throw new Error('Invalid search query');
    }
    let query = data.name;
    data.artists.forEach((artist) => {
      query += ` ${artist.name}`;
    });
    return new Promise((resolve) => {
      resolve(query);
    })
  }

  async getTrackData(link) {
    let songId;
    let data;
    try {
      songId = link.split('/track/')[1].split('?')[0];
      if (!songId) {
        throw new Error('Invalid Spotify link');
      }
    } catch (e) {
      console.log(e);
      throw new Error('Invalid Spotify link');
    }
    try {
      await axios.get('https://api.spotify.com/v1/tracks/' + songId, {
        headers: `Authorization: Bearer ${this.accessToken}`
      }).then((response) => {
        data = response.data
      });
    } catch (e) {
      console.log(e);
      if (e.response.status === 401) {
        throw new Error('Spotify Auth failed');
      } 
      throw new Error ("Something went wrong fetching the track data from Spotify");
    }
    return data;
  }

  async fetchNewAccessToken() {
    await axios.post('https://accounts.spotify.com/api/token',
      `grant_type=client_credentials&client_id=${spotifyClientId}&client_secret=${spotifyClientSecret}`,
      {
        headers: 'Content-Type: application/x-www-form-urlencoded'
      }
    ).then((response) => {
      this.accessToken = response.data.access_token;
    }).catch((err) => {
      console.log('failed to get spotify token', err);
      throw new Error('Failed to renew spotify auth token');
    })
  }
}