const fs = require('fs');
const PImage = require('pureimage');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

const https_get_P = (url) => new Promise((res) => https.get(url, res));

const MAX_WORD_LIMIT = 30;

const MAX_WORD_LIMIT_SMALL = 40;

module.exports = class ImageMaker {
  async makeImage(url, contextPreLines, quoteLines, contextPostLines, authorLine, filepath) {
    const font = PImage.registerFont(
      './fonts/Roboto-Medium.ttf',
      'MyFont',
    );
    await font.load();
    let image_stream = await https_get_P(url);
    let img = await PImage.decodePNGFromStream(image_stream);
    var img2 = PImage.make(600, 256);
    const ctx = img2.getContext('2d');
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height, // source dimensions
      0,
      0,
      256,
      256, // destination dimensions
    );
    ctx.fillStyle = 'black';
    ctx.fillRect(256, 0, 600, 256);
    ctx.fillStyle = 'white';
    const lineHeight = 24;
    const linesImageCanHold = 10;
    const maxLines = quoteLines.length + contextPreLines.length + contextPostLines.length + 1;
    const startHeight = ((linesImageCanHold / 2) - Math.floor(maxLines / 2) + 1) * lineHeight;
    let currentLine = 0;
    this.addLinesToImage(contextPreLines, ctx, lineHeight, maxLines, 12, startHeight, currentLine);
    currentLine += contextPreLines.length;
    this.addLinesToImage(quoteLines, ctx, lineHeight, maxLines, 16, startHeight, currentLine);
    currentLine += quoteLines.length;
    this.addLinesToImage(contextPostLines, ctx, lineHeight, maxLines, 12, startHeight, currentLine);
    currentLine += contextPostLines.length;
    this.addLinesToImage(authorLine, ctx, lineHeight, maxLines, 16, startHeight, currentLine);
    await PImage.encodePNGToStream(img2, fs.createWriteStream(filepath));
    console.log("done writing to ", filepath);
  }

  getFilePath() {
    return './images/' + uuidv4() + '.png';
  }

  deleteQuoteImage(filePath) {
    fs.unlinkSync(filePath,  (err) => {
      console.log(err);
    });
  }

  addLinesToImage(lines, ctx, lineHeight, maxLines, fontSize, initialStart, textBlockStart) {
    ctx.font = fontSize + 'pt MyFont';
    let currentLine = textBlockStart;
    lines.forEach((line) => {
      const y = initialStart + (currentLine * lineHeight);
      const x = currentLine === maxLines - 1 ? 365 : 315;
      ctx.fillText(line, x, y);
      currentLine++;
    })
  }

  getLinesFromInput(text, isSmall) {
    if (!text || text.length === 0) {
      return [];
    }
    const lines = [];
    let currentLine = 0;
    text.split(' ').forEach((word, index) => {
      if (index === 0) {
        lines[currentLine] = word
      } else if (lines[currentLine].length < (isSmall ? MAX_WORD_LIMIT_SMALL : MAX_WORD_LIMIT)) {
        lines[currentLine] = lines[currentLine] + ' ' + word;
      } else {
        currentLine++;
        lines[currentLine] = word;
      }
    });
    return lines;
  }
}