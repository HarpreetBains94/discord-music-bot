const youtubesearchapi = require("youtube-search-api");

module.exports = {
  isAppleMusicLink: (maybeLink) => {
    return maybeLink.includes('music.apple.com');
  },

  isSpotifyLink: (maybeLink) => {
    return maybeLink.includes('open.spotify.com/track/') || maybeLink.includes('spotify.link/');
  },

  isTidalLink: (maybeLink) => {
    return maybeLink.includes('tidal.com/track/') || maybeLink.includes('tidal.com/browse/track/');
  }
}