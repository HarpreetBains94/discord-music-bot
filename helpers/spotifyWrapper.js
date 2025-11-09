const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = '';

module.exports = class SpotifyWrapper {
  async getSongId(link) {
    if (link.includes('open')) {
      return link.split('/track/')[1].split('?')[0];
    }
    // This is to handle spotifys new shortened links
    // since they redirect to a page that actually has the song id I
    // get the redirected page and get the id from there
    var data = await fetch(link).then((res) => res.json());
    if (data.includes('open.spotify.com/track/')) {
      return data.split('open.spotify.com/track/')[1].split('?')[0];
    }
    return null;
  }

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
    if (data == null) return null;
    if (!data?.name || !data?.artists?.length) {
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
      songId = await this.getSongId(link);
      if (songId === '') {
        throw new Error('Invalid Spotify link');
      }
      if (songId == null) {
        return null
      }
    } catch (e) {
      console.log(e);
      throw new Error('Invalid Spotify link');
    }
    try {
      await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        headers: {'Authorization': `Bearer ${this.accessToken}`}
      }).then((response) => response.json())
      .then((responseData) => {
        data = responseData;
      });
    } catch (e) {
      console.log(e);
      if (e.response?.status === 401) {
        throw new Error('Spotify Auth failed');
      } 
      throw new Error('Something went wrong fetching the track data from Spotify');
    }
    return data;
  }

  async fetchNewAccessToken() {
    await fetch('https://accounts.spotify.com/api/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': spotifyClientId,
          'client_secret': spotifyClientSecret
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