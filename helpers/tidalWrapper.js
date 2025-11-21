const tidalClientId = process.env.TIDAL_CLIENT_ID;
const tidalClientSecret = process.env.TIDAL_CLIENT_SECRET;

let accessToken = '';

module.exports = class TidalWrapper {
  getSongId(link) {
    return link.split('/track/')[1].split('/')[0].split('?')[0];
  }

  async getYoutubeSearchQueryForMessage(message) {
    let title;
    let artist;
    try {
      await this.fetchNewAccessToken();
    } catch (e) {
      throw e;
    }
    
    const songId = this.getSongId(message.content);
    if (!songId) throw new Error('Invalid Tidal link');

    try {
      [title, artist] = await Promise.all([this.getTrackTitle(songId), this.getTrackArtist(songId)]);
    } catch (e) {
      throw e;
    }
    if (!title || !artist) return null;

    return new Promise((resolve) => {
      resolve(`${title} ${artist}`);
    })
  }

  async getTrackTitle(songId) {
    let data;
    try {
      await fetch(`https://openapi.tidal.com/v2/tracks/${songId}`, {
        headers: {'Authorization': `Bearer ${this.accessToken}`}
      }).then((response) => response.json())
      .then((responseData) => {
        data = responseData.data;
      });
    } catch (e) {
      console.log(e);
      if (e.response?.status === 401) {
        throw new Error('Tidal Auth failed');
      } 
      throw new Error('Something went wrong fetching the track data from Tidal');
    }
    if (!data?.attributes?.title) {
      throw new Error('Invalid search query');
    }
    return data.attributes.title;
  }

  async getTrackArtist(songId) {
    let data;
    try {
      await fetch(`https://openapi.tidal.com/v2/tracks/${songId}/relationships/artists?countryCode=GB&include=artists`, {
        headers: {'Authorization': `Bearer ${this.accessToken}`}
      }).then((response) => response.json())
      .then((responseData) => {
        data = responseData.included;
      });
    } catch (e) {
      console.log(e);
      if (e.response?.status === 401) {
        throw new Error('Tidal Auth failed');
      } 
      throw new Error('Something went wrong fetching the track data from Tidal');
    }
    if (!data?.length) {
      throw new Error('Invalid search query');
    }
    return data[0].attributes.name;
  }

  async fetchNewAccessToken() {
    await fetch('https://auth.tidal.com/v1/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(tidalClientId + ':' + tidalClientSecret, "utf8").toString("base64")}`
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials'
        })
      }
    ).then((response) => response.json())
    .then((data) => {
      this.accessToken = data.access_token;
    }).catch((err) => {
      console.log('Failed to get spotify token', err);
      throw new Error('Failed to renew spotify auth token');
    })
  }
}