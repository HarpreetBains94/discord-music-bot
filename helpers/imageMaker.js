const fs = require("fs");
const PImage = require("pureimage");
const https = require("https");
const { v4: uuidv4 } = require("uuid");

const https_get_P = (url) => new Promise((res) => https.get(url, res));

module.exports = class ImageMaker {
  async makeImage(url, quoteLines, filepath) {
    const font = PImage.registerFont(
      "./fonts/Roboto-Medium.ttf",
      "MyFont",
    );
    await font.load();
    let image_stream = await https_get_P(url);
    let img = await PImage.decodePNGFromStream(image_stream);
    var img2 = PImage.make(600, 256);
    const ctx = img2.getContext("2d");
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
    ctx.fillStyle = "black";
    ctx.fillRect(256, 0, 600, 256);
    // const grad = ctx.createLinearGradient(230, 0, 600, 256);
    // grad.addColorStop(0, 'transparent');
    // grad.addColorStop(1, 'black');
    // ctx.fillStyle = grad;
    // ctx.fillRect(0, 0, 600, 256);
    ctx.fillStyle = "white";
    ctx.font = "16pt MyFont";
    const lineHeight = 24;
    const linesImageCanHold = 10;
    const maxLines = quoteLines.length;
    const startHeight = ((linesImageCanHold / 2) - Math.floor(maxLines / 2) + 1) * lineHeight;
    let currentLine = 0;
    quoteLines.forEach((line) => {
      const y = startHeight + (currentLine * lineHeight);
      const x = currentLine === maxLines - 1 ? 365 : 315;
      ctx.fillText(line, x, y);
      currentLine++;
    })
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
}