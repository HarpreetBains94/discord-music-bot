module.exports = class AppleMusicWrapper {
  async getYoutubeSearchQueryForMessage(message) {
    // wait for discord to embed apple link and get the metadata from that
    // im not paying apple for an api for this dumb bot
    message.channel.send('Give me a sec, I\'m trying to avoid paying apple')
    return new Promise((resolve) => {
      setTimeout(async () => {
        const messageWithEmbed = await message.channel.messages.fetch(message.id);
        if (!messageWithEmbed || !messageWithEmbed.embeds || messageWithEmbed.embeds.length === 0) {
          resolve('Invalid search query');
        } else {
          resolve(messageWithEmbed.embeds[0].title);
        }
      }, 5000)
    })
  }
}