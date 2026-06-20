const youtubesearchapi = require("youtube-search-api");

module.exports = class YoutubeWrapper {
  async getVideoLinkForQuery(query) {
    const data = await youtubesearchapi.GetListByKeyword(query, false, 1, {});
    if (!data || !data.items || data.items.length === 0) {
      return `Unable to find video for query: ${query}`;
    }
    return `https://www.youtube.com/watch?v=${data.items[0].id}`;
  }
}