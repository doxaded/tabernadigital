const Jimp = require('jimp');

async function processImage() {
  const image = await Jimp.read('public/beer-mug-logo.png');
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  // get background color from top-left pixel
  const bgColorInt = image.getPixelColor(0, 0);
  const bgR = Jimp.intToRGBA(bgColorInt).r;
  const bgG = Jimp.intToRGBA(bgColorInt).g;
  const bgB = Jimp.intToRGBA(bgColorInt).b;
  
  const tolerance = 20;

  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    if (Math.abs(r - bgR) < tolerance && Math.abs(g - bgG) < tolerance && Math.abs(b - bgB) < tolerance) {
      this.bitmap.data[idx + 3] = 0; // alpha to 0
    }
  });

  // crop the image to remove empty transparent space around it
  image.autocrop();

  await image.writeAsync('public/beer-mug-logo.png');
  console.log('Done processing image.');
}

processImage().catch(console.error);
