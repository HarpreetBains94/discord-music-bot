const { EmbedBuilder } = require('discord.js');
const youtubesearchapi = require("youtube-search-api");

const TOKEN = process.env.TMDB_ACCESS_TOKEN;
const URL_BASE = 'https://api.themoviedb.org/3';
const IMAGE_URL_BASE = 'https://image.tmdb.org/t/p/original';

module.exports = class TmdbWrapper {

  async getEmbed(query, year) {
    return this.getMovieData(query, year).then((data) => {
      const embed = new EmbedBuilder()
        .setTitle(`${data.tmdbData.title} (${data.tmdbData.release_date.substr(0, 4)})`)
        .setDescription(data.tmdbData.overview || '')
        .addFields(
            { name: 'Audience Score', value: `${this.getAudienceScore(data.tmdbData)}`, inline: true },
            { name: 'Runtime', value: `${this.convertMinutesToHours(data.tmdbData.runtime)}`, inline: true },
            { name: 'Genres', value: `${this.getGenres(data.tmdbData.genres)}`, inline: true },
          )
        .setImage(IMAGE_URL_BASE + data.tmdbData.backdrop_path)
        .setFooter({
          text: 'Data sourced from https://www.themoviedb.org/',
          iconURL: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg'
        });
        return {
          embed,
          trailer: data.trailer,
        };
    }).catch((err) => {
      throw err;
    });
  }

  async getMovieData(query, year) {
    const tmdbSearchData = await fetch(`${URL_BASE}/search/movie?query=${encodeURIComponent(query)}${year ? '&year=' + encodeURIComponent(year) : ''}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    }).then((response => {
      if (!response.ok) {
        throw new Error('TMDB search response not ok');
      }
      return response.json()
    })).then((data) => {
      if (data.results.length === 0) {
        throw new Error('TMDB search returned no results');
      }
      return data.results[0];
    }).catch((err) => {
      console.log('TMDB search request failed', err);
      throw new Error('TMDB search request failed');
    });

    const tmdbData = await fetch(`${URL_BASE}/movie/${tmdbSearchData.id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    }).then((response => {
      if (!response.ok) {
        throw new Error('TMDB details fetch response not ok');
      }
      return response.json()
    })).then((data) => {
      if (!data) {
        throw new Error('TMDB movie id incorrect somehow??');
      }
      return data;
    }).catch((err) => {
      console.log('TMDB details fetch request failed', err);
      throw new Error('TMDB details fetch request failed');
    });

    const trailerData = await youtubesearchapi.GetListByKeyword(tmdbData.title + ' ' + tmdbData.release_date.substr(0, 4) + ' trailer', false, 1, {}).catch((err) => {
      console.log('Failed to fetch movie trailer', err)
      throw new Error('Failed to fetch movie trailer');
    });

    var trailer = '';
    if (trailerData && trailerData.items && trailerData.items.length !== 0) {
      trailer = `https://www.youtube.com/watch?v=${trailerData.items[0].id}`;
    }

    return {
      tmdbData,
      trailer,
    };
  }

  convertMinutesToHours(time) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return `${hours ? hours + 'h' : ''} ${minutes}m`;
  }

  getGenres(genresArray) {
    return genresArray.map(genre => genre.name).join(', ');
  }

  getAudienceScore(data) {
    const score = Math.round(data.vote_average * 10) / 10
    return `${this.getEmojiForScore(score)} ${score}/10 (${this.getSuffixedNumber(data.vote_count)})`
  }

  getSuffixedNumber(num) {
    const formatter = Intl.NumberFormat('en', { notation: 'compact' });
    return formatter.format(num);
  }

  getEmojiForScore(score) {
    if (score > 9) {
      return '🔥';
    }
    if (score > 8) {
      return '😍';
    }
    if (score > 7) {
      return '😀';
    }
    if (score > 6) {
      return '😊';
    }
    if (score > 5) {
      return '😐';
    }
    if (score > 4) {
      return '🤨';
    }
    if (score > 3) {
      return '😣';
    }
    if (score > 2) {
      return '🤢';
    }
    if (score > 1) {
      return '🤮';
    }
    return '🗑️';
  }
}