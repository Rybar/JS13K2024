/**
 * RetroBuffer class for creating indexed-color drawing API for pixel-art games.
 */
import LCG from './LCG';
class RetroBuffer {
  /**
     * Creates an instance of RetroBuffer.
     * @constructor
     * @param {int} width - The width of the buffer.
     * @param {int} height - The height of the buffer.
     * @param {Uint32Array} atlas - The color atlas.
     * @param {int} pages - The number of pages in the buffer.
     */
  constructor (width, height, atlas, pages) {
    this.WIDTH = width;
    this.HEIGHT = height;
    this.PAGESIZE = this.WIDTH * this.HEIGHT;
    this.PAGES = pages;
    this.atlas = atlas;
    this.LCG = new LCG (0xdeadbeef);

    this.SCREEN = 0;

    /**
     * The pages in the buffer can be referenced by their index, i.e. PAGE_1, PAGE_2, etc.
     */
    for (let i = 1; i <= this.PAGES; i++) {
      this[`PAGE_${i}`] = this.PAGESIZE * i;
    }

    this.stencil = false;
    this.stencilSource = this.PAGE_2;
    this.stencilOffset = 0;

    this.colors = this.atlas.slice (0, 64);

    // Default palette index
    this.palDefault = Array.from ({length: 64}, (_, i) => i);

    this.c = document.createElement ('canvas');
    this.c.width = this.WIDTH;
    this.c.height = this.HEIGHT;
    this.ctx = this.c.getContext ('2d');
    this.renderTarget = 0x00000;
    this.renderSource = this.PAGESIZE; // Buffer is ahead one screen's worth of pixels

    // The characters available in the build-in pixel font, in order
    this.fontString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.\'"?/<()';

    // Base64 encoded font bitmap
    //TODO: Move fontbitmap to palette atlas img/palette.webp
    this.fontBitmapBase64 =
      '/H8Y+j6PvwhB/JRj78OQ/+HIQ/C8fxj+MfkIT/xCl6MuSjCEIfjusYxzWcXRjF3oy5B0Yyf6PoxfBwffIQhIxjF0YxUSMa1dFRFRiohCfERHyMIRzoiJ/wTB9KXxC/DwfPh6LvhEQjoui50Xhc6MYuAAAPkIQBPxvW6vq+oAAAIYRAA2mQAOiYBAiIiAiIIIRCEE';
    // Decode Base64 string to binary data and store as a typed array
    const binaryString = atob (this.fontBitmapBase64);
    this.fontBitmap = new Uint8Array (binaryString.length * 8);
    for (let i = 0; i < binaryString.length; i++) {
      let byte = binaryString.charCodeAt (i);
      for (let bit = 0; bit < 8; bit++) {
        this.fontBitmap[i * 8 + bit] = (byte >> (7 - bit)) & 1;
      }
    }

    this.pal = Array.from ({length: 65}, (_, i) => i);

    /**
     * The dither pattern table used for gradients and 2-color pattern fills.
     * default is set to 4x4 bayer dither, array length 16
     */
    this.dither = [
      0b1111111111111111,
      0b1111111111110111,
      0b1111110111110111,
      0b1111110111110101,
      0b1111010111110101,
      0b1111010110110101,
      0b1110010110110101,
      0b1110010110100101,
      0b1010010110100101,
      0b1010010110100001,
      0b1010010010100001,
      0b1010010010100000,
      0b1010000010100000,
      0b1010000000100000,
      0b1000000000100000,
      0b1000000000000000,
      0b0000000000000000,
    ];

    /**
     * The pattern to use for dithering. A 16-bit number where each bit represents a pixel in a 4x4 grid.
     * @type {number}
     * @default 0b1111111111111111
     * 
     */
    this.pat = 0b1111111111111111;

    this.ctx.imageSmoothingEnabled = false;

    this.imageData = this.ctx.getImageData (0, 0, this.WIDTH, this.HEIGHT);
    this.buf = new ArrayBuffer (this.imageData.data.length);
    this.buf8 = new Uint8Array (this.buf);
    this.data = new Uint32Array (this.buf);
    this.ram = new Uint8Array (this.WIDTH * this.HEIGHT * this.PAGES);

    // Brightness LUT
    this.brightness = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 64; j++) {
        this.brightness[i * 64 + j] = this.colors.indexOf (
          this.atlas[i * 64 + j]
        );
      }
    }
  }

  /**
     * Clears the buffer with the specified color.
     * @param {int} color - The color to clear the buffer with.
     * @param {int} page - The page to clear.
     */
  clear (color, page) {
    this.ram.fill (color, page, page + this.PAGESIZE);
  }

  /**
     * Sets a pixel at the specified coordinates.
     * @param {int} x - The x-coordinate.
     * @param {int} y - The y-coordinate.
     * @param {int} color - The color of the pixel.
     * @param {int} [color2=64] - The secondary color.
     */
  pset (x, y, color, color2 = 64) {
    x = x | 0;
    y = y | 0;
    color = this.stencil
      ? this.pget (x, y, this.stencilSource) + this.stencilOffset
      : (color | 0) % 64;
    let px = y % 4 * 4 + x % 4;
    let mask = this.pat & Math.pow (2, px);
    let pcolor = mask ? color : color2;
    if (pcolor == 64) return;
    if (x < 0 || x > this.WIDTH - 1) return;
    if (y < 0 || y > this.HEIGHT - 1) return;

    this.ram[this.renderTarget + y * this.WIDTH + x] = pcolor;
  }

  /**
     * Gets the color of the pixel at the specified coordinates.
     * @param {int} x - The x-coordinate.
     * @param {int} y - The y-coordinate.
     * @param {int} [page=0] - The page to read from.
     * @returns {int} - The color of the pixel.
     */
  pget (x, y, page = 0) {
    x = x | 0;
    y = y | 0;
    return this.ram[page + x + y * this.WIDTH];
  }

  /**
     * Draws a line between two points.
     * @param {number} x1 - The x-coordinate of the first point.
     * @param {number} y1 - The y-coordinate of the first point.
     * @param {number} x2 - The x-coordinate of the second point.
     * @param {number} y2 - The y-coordinate of the second point.
     * @param {number} color - The color of the line.
     */
  line (x1, y1, x2, y2, color, color2 = 64) {
    x1 = x1 | 0;
    x2 = x2 | 0;
    y1 = y1 | 0;
    y2 = y2 | 0;

    var dy = y2 - y1;
    var dx = x2 - x1;
    var stepx, stepy;

    if (dy < 0) {
      dy = -dy;
      stepy = -1;
    } else {
      stepy = 1;
    }
    if (dx < 0) {
      dx = -dx;
      stepx = -1;
    } else {
      stepx = 1;
    }
    dy <<= 1;
    dx <<= 1;

    this.pset (x1, y1, color, color2);
    if (dx > dy) {
      var fraction = dy - (dx >> 1);
      while (x1 != x2) {
        if (fraction >= 0) {
          y1 += stepy;
          fraction -= dx;
        }
        x1 += stepx;
        fraction += dy;
        this.pset (x1, y1, color, color2);
      }
    } else {
      fraction = dx - (dy >> 1);
      while (y1 != y2) {
        if (fraction >= 0) {
          x1 += stepx;
          fraction -= dy;
        }
        y1 += stepy;
        fraction += dx;
        this.pset (x1, y1, color, color2);
      }
    }
  }
  /**
     * Draws a circle.
     * @param {number} xm - The x-coordinate of the center of the circle.
     * @param {number} ym - The y-coordinate of the center of the circle.
     * @param {number} r - The radius of the circle.
     * @param {number} color - The color of the circle.
     */
  circle (xm, ym, r, color, color2 = 64) {
    xm = xm | 0;
    ym = ym | 0;
    r = r | 0;
    color = color | 0;
    var x = -r, y = 0, err = 2 - 2 * r;
    do {
      this.pset (xm - x, ym + y, color, color2);
      this.pset (xm - y, ym - x, color, color2);
      this.pset (xm + x, ym - y, color, color2);
      this.pset (xm + y, ym + x, color, color2);
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
  }

  /**
     * Fills a circle.
     * @param {number} xm - The x-coordinate of the center of the circle.
     * @param {number} ym - The y-coordinate of the center of the circle.
     * @param {number} r - The radius of the circle.
     * @param {number} color - The color of the circle.
     */
  fillCircle (xm, ym, r, color, color2 = 64) {
    xm = xm | 0;
    ym = ym | 0;
    r = r | 0;
    color = color | 0;
    if (r < 0) return;
    var x = -r, y = 0, err = 2 - 2 * r;
    do {
      this.line (xm - x, ym - y, xm + x, ym - y, color, color2);
      this.line (xm - x, ym + y, xm + x, ym + y, color, color2);
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
  }
  /**
     * Draws a rectangle.
     * @param {number} x - The x-coordinate of the top-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the top-left corner of the rectangle.
     * @param {number} w - The width of the rectangle.
     * @param {number} h - The height of the rectangle.
     * @param {number} color - The color of the rectangle.
     */
  rect (x, y, w, h, color, color2 = 64) {
    color = color;
    let x1 = x | 0;
    let y1 = y | 0;
    let x2 = (x + w) | 0;
    let y2 = (y + h) | 0;

    this.line (x1, y1, x2, y1, color, color2);
    this.line (x2, y1, x2, y2, color, color2);
    this.line (x1, y2, x2, y2, color, color2);
    this.line (x1, y1, x1, y2, color, color2);
  }

  /**
     * Fills a rectangle.
     * @param {number} x - The x-coordinate of the top-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the top-left corner of the rectangle.
     * @param {number} w - The width of the rectangle.
     * @param {number} h - The height of the rectangle.
     * @param {number} color - The color of the rectangle.
     */
  fillRect (x, y, w, h, color, color2 = 64) {
    let x1 = x | 0;
    let y1 = y | 0;
    let x2 = ((x + w) | 0) - 1;
    let y2 = ((y + h) | 0) - 1;
    color = color;

    var i = Math.abs (y2 - y1);
    this.line (x1, y1, x2, y1, color, color2);

    if (i > 0) {
      while (--i) {
        this.line (x1, y1 + i, x2, y1 + i, color, color2);
      }
    }

    this.line (x1, y2, x2, y2, color, color2);
  }

  /**
      * Fills a rectangle with a gradient between two colors.
      * @param {number} x - The x-coordinate of the rectangle.
      * @param {number} y - The y-coordinate of the rectangle.
      * @param {number} w - The width of the rectangle.
      * @param {number} h - The height of the rectangle.
      * @param {number} color1 - The starting color index.
      * @param {number} color2 - The ending color index.
      * @param {number} angle - The angle of the gradient in degrees.
      */
  gradRect (x, y, w, h, color1, color2, angle) {
    let prevPat = this.pat;
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos (rad);
    const sin = Math.sin (rad);

    // Calculate the projection of the corners
    const corners = [{x: 0, y: 0}, {x: w, y: 0}, {x: 0, y: h}, {x: w, y: h}];

    const projections = corners.map (corner => {
      const dx = corner.x - w / 2;
      const dy = corner.y - h / 2;
      return dx * cos + dy * sin;
    });

    const minProjection = Math.min (...projections);
    const maxProjection = Math.max (...projections);
    const projectionRange = maxProjection - minProjection;

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        // Calculate position within the gradient
        const dx = i - w / 2;
        const dy = j - h / 2;
        const distance = dx * cos + dy * sin;

        // Normalize distance to range 0 to 1
        const normalizedDistance = (distance - minProjection) / projectionRange;

        // Map normalized distance to a range of 0 to 15 for dither patterns
        const patternIndex = Math.floor (normalizedDistance * 15);
        const pattern = Math.max (0, Math.min (15, patternIndex));

        // Set the dither pattern
        this.pat = this.dither[pattern];

        // Draw the pixel with interpolated colors
        this.pset (x + i, y + j, color1, color2);
      }
    }
    this.pat = prevPat;
  }

  /**
     * Draws a scaled sprite from rectangular area in renderSource to rectangular area in renderTarget.
     * @param {number} sx - The x-coordinate of the top-left corner of the sprite in the source image.
     * @param {number} sy - The y-coordinate of the top-left corner of the sprite in the source image.
     * @param {number} sw - The width of the sprite in the source image.
     * @param {number} sh - The height of the sprite in the source image.
     * @param {number} x - The x-coordinate of the top-left corner of the sprite on the screen.
     * @param {number} y - The y-coordinate of the top-left corner of the sprite on the screen.
     * @param {number} dw - The width of the sprite on the screen.
     * @param {number} dh - The height of the sprite on the screen.
     * @param {boolean} flipx - Whether to flip the sprite horizontally.
     * @param {boolean} flipy - Whether to flip the sprite vertically.
     */
  sspr (
    sx = 0,
    sy = 0,
    sw = 16,
    sh = 16,
    x = 0,
    y = 0,
    dw = 32,
    dh = 32,
    flipx = false,
    flipy = false
  ) {
    var xratio = sw / dw;
    var yratio = sh / dh;
    this.pat = this.dither[0]; // Reset pattern
    for (var i = 0; i < dh; i++) {
      for (var j = 0; j < dw; j++) {
        let px = (j * xratio) | 0;
        let py = (i * yratio) | 0;
        sy = flipy ? sh - py - i : sy;
        sx = flipx ? sw - px - j : sx;
        let source = this.pget (sx + px, sy + py, this.renderSource);
        if (source > 0) {
          this.pset (x + j, y + i, source);
        }
      }
    }
  }

  /**
   * Fills a circle with a gradient between two colors.
   * @param {number} xm - The x-coordinate of the circle center.
   * @param {number} ym - The y-coordinate of the circle center.
   * @param {number} r - The radius of the circle.
   * @param {number} color1 - The starting color index.
   * @param {number} color2 - The ending color index.
   * @param {number} angle - The angle of the gradient in degrees.
   */
  gradCircle (xm, ym, r, color1, color2, angle) {
    let prevPat = this.pat; // Preserve the existing pattern setting

    // Convert angle to radians
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos (rad);
    const sin = Math.sin (rad);

    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          // Calculate position within the gradient
          const dx = x;
          const dy = y;
          const distance = dx * cos + dy * sin;

          // Normalize distance to range 0 to 1
          const normalizedDistance = (distance + r) / (2 * r);

          // Map normalized distance to a range of 0 to 15 for dither patterns
          const patternIndex = Math.floor (normalizedDistance * 15);
          const pattern = Math.max (0, Math.min (15, patternIndex));

          // Set the dither pattern
          this.pat = this.dither[pattern];

          // Draw the pixel with interpolated colors
          this.pset (xm + x, ym + y, color1, color2);
        }
      }
    }

    this.pat = prevPat; // Restore the previous pattern setting
  }

  /**
   * Fills a triangle with a solid color.
   * @param {object} p1 - The first vertex of the triangle.
   * @param {object} p2 - The second vertex of the triangle.
   * @param {object} p3 - The third vertex of the triangle.
   * @param {number} color - The color index to fill the triangle.
   */
  fillTriangle (p1, p2, p3, color) {
    // Find bounding box
    const minX = Math.min (p1.x, p2.x, p3.x);
    const maxX = Math.max (p1.x, p2.x, p3.x);
    const minY = Math.min (p1.y, p2.y, p3.y);
    const maxY = Math.max (p1.y, p2.y, p3.y);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.pointInTriangle ({x, y}, p1, p2, p3)) {
          this.pset (x, y, color);
        }
      }
    }
  }

  /**
   * Fills a triangle with a gradient between two colors.
   * @param {object} p1 - The first vertex of the triangle.
   * @param {object} p2 - The second vertex of the triangle.
   * @param {object} p3 - The third vertex of the triangle.
   * @param {number} color1 - The starting color index.
   * @param {number} color2 - The ending color index.
   * @param {number} angle - The angle of the gradient in degrees.
   */
  gradTriangle (p1, p2, p3, color1, color2, angle) {
    let prevPat = this.pat; // Preserve the existing pattern setting

    // Convert angle to radians
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos (rad);
    const sin = Math.sin (rad);

    // Find bounding box
    const minX = Math.min (p1.x, p2.x, p3.x);
    const maxX = Math.max (p1.x, p2.x, p3.x);
    const minY = Math.min (p1.y, p2.y, p3.y);
    const maxY = Math.max (p1.y, p2.y, p3.y);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.pointInTriangle ({x, y}, p1, p2, p3)) {
          // Calculate position within the gradient
          const dx = x - (p1.x + p2.x + p3.x) / 3;
          const dy = y - (p1.y + p2.y + p3.y) / 3;
          const distance = dx * cos + dy * sin;

          // Normalize distance to range 0 to 1
          const maxDist = Math.max (maxX - minX, maxY - minY);
          const normalizedDistance = (distance + maxDist / 2) / maxDist;

          // Map normalized distance to a range of 0 to 15 for dither patterns
          const patternIndex = Math.floor (normalizedDistance * 15);
          const pattern = Math.max (0, Math.min (15, patternIndex));

          // Set the dither pattern
          this.pat = this.dither[pattern];

          // Draw the pixel with interpolated colors
          this.pset (x, y, color1, color2);
        }
      }
    }

    this.pat = prevPat; // Restore the previous pattern setting
  }

  /**
 * Draws a brick wall pattern with optional gaps for mortar and a specified or random dither pattern.
 * @param {number} x - The x position of the top-left corner of the wall
 * @param {number} y - The y position of the top-left corner of the wall
 * @param {number} width - The total width of the wall
 * @param {number} height - The total height of the wall
 * @param {number} brickWidth - The width of each brick
 * @param {number} brickHeight - The height of each brick
 * @param {number} color1 - The main color of the bricks
 * @param {number} color2 - The secondary color of the bricks
 * @param {number} offset - The offset of the bricks in alternating rows
 * @param {number} gap - The gap between bricks to simulate mortar
 * @param {number} backgroundColor - The color of the mortar
 * @param {number} [pattern] - Optional. The dither pattern to use for the bricks. If not provided, a random pattern will be used.
 */
  brick (
    x,
    y,
    width,
    height,
    brickWidth,
    brickHeight,
    color1,
    color2,
    offset,
    gap,
    pattern
  ) {
    const rows = Math.ceil (height / (brickHeight + gap));
    const cols = Math.ceil (width / (brickWidth + gap));
    
    this.LCG.state = 0xdeadbeef; // Reset the random number generator

    for (let row = 0; row < rows; row++) {
      let startX = x;
      let offsetRow = false;
      if (row % 2 !== 0) {
        startX -= offset;
        offsetRow = true;
      }

      for (let col = 0; col <= cols; col++) {
        let brickX = startX + col * (brickWidth + gap);
        let brickY = y + row * (brickHeight + gap);

        // Ensure bricks are within the bounds
        var adjustedBrickWidth = brickX + brickWidth > x + width
          ? x + width - brickX
          : brickWidth;
        var adjustedBrickHeight = brickY + brickHeight > y + height
          ? y + height - brickY
          : brickHeight;

        if (col == 0 && offsetRow) {
          brickX += offset;
          adjustedBrickWidth -= offset;
        }

        // Draw brick only if it is within the bounds
        if (brickX < x + width && brickX + adjustedBrickWidth > x) {
          const brickPattern = pattern !== undefined
            ? this.dither[pattern]
            : this.dither[this.LCG.randomInt (0, 15)];
          this.pat = brickPattern;
          this.fillRect (
            brickX,
            brickY,
            adjustedBrickWidth,
            adjustedBrickHeight,
            color1,
            color2
          );
        }
      }
    }
    // Reset the pattern
    this.pat = 0b1111111111111111;
  }

  /**
   * Helper function to determine if a point is inside a triangle
   * @param {object} p - The point to test.
   * @param {object} p1 - The first vertex of the triangle.
   * @param {object} p2 - The second vertex of the triangle.
   * @param {object} p3 - The third vertex of the triangle.
   * @returns {boolean} - True if the point is inside the triangle, false otherwise.
   */
  pointInTriangle (p, p1, p2, p3) {
    const d1 = this.sign (p, p1, p2);
    const d2 = this.sign (p, p2, p3);
    const d3 = this.sign (p, p3, p1);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
  }

  /**
       * Helper function to calculate the sign of a point relative to a line
       * @param {object} p1 - The point to test.
       * @param {object} p2 - The first vertex of the line.
       * @param {object} p3 - The second vertex of the line.
       * @returns {number} - The sign value.
       */
  sign (p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  /**
     * Loads an image into the buffer.
     * @param {HTMLImageElement} image - The image to load.
     * @param {number} address - The address in the buffer to load the image into.
     */
  imageToRam (image, address) {
    let tempCanvas = document.createElement ('canvas');
    tempCanvas.width = this.WIDTH;
    tempCanvas.height = this.HEIGHT;
    let context = tempCanvas.getContext ('2d');
    context.drawImage (image, 0, 0);

    let imageData = context.getImageData (0, 0, this.WIDTH, this.HEIGHT);
    let data = new Uint32Array (imageData.data.buffer);

    for (var i = 0; i < data.length; i++) {
      this.ram[address + i] = this.colors.indexOf (data[i]);
    }
  }

  /**
     * Renders the buffer to the canvas.
     */
  render () {
    var i = this.PAGESIZE;

    while (i--) {
      if (i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];
    }

    this.imageData.data.set (this.buf8);
    this.c.width = this.c.width;
    this.ctx.putImageData (this.imageData, 0, 0);
  }

  /**
     * Gets the binary representation of a character.
     * @param {string} char - The character to get.
     * @returns {Uint8Array} - The binary representation of the character.
     */
  getCharacter (char) {
    let index = this.fontString.indexOf (char);
    let start = index * 25;
    let end = start + 25;
    return this.fontBitmap.slice (start, end);
  }

  /**
     * Renders a single line of text.
     * @param {string} text - The text to render.
     * @param {number} x - The x-coordinate of the text.
     * @param {number} y - The y-coordinate of the text.
     * @param {number} hspacing - The horizontal spacing between characters.
     * @param {number} vspacing - The vertical spacing between lines.
     * @param {string} halign - The horizontal alignment of the text.
     * @param {string} valign - The vertical alignment of the text.
     * @param {number} scale - The scale of the text.
     * @param {number} color - The color of the text.
     */
  textLine (text, x, y, hspacing, vspacing, halign, valign, scale, color) {
    var textLength = text.length;
    var size = 5;

    for (var i = 0; i < textLength; i++) {
      var letter = this.getCharacter (text.charAt (i));

      for (var yi = 0; yi < size; yi++) {
        for (var xi = 0; xi < size; xi++) {
          if (letter[yi * size + xi] == 1) {
            if (scale == 1) {
              this.pset (
                x + xi * scale + (size * scale + hspacing) * i,
                y + yi * scale,
                color
              );
            } else {
              this.fillRect (
                x + xi * scale + (size * scale + hspacing) * i,
                y + yi * scale,
                scale,
                scale,
                color
              );
            }
          }
        }
      }
    }
  }

  /**
     * Renders text with multiple lines.
     * @param {string} text - The text to render.
     * @param {number} x - The x-coordinate of the text.
     * @param {number} y - The y-coordinate of the text.
     * @param {number} hspacing - The horizontal spacing between characters.
     * @param {number} vspacing - The vertical spacing between lines.
     * @param {string} halign - The horizontal alignment of the text.
     * @param {string} valign - The vertical alignment of the text.
     * @param {number} scale - The scale of the text.
     * @param {number} color - The color of the text.
     */
  text (text, x, y, hspacing, vspacing, halign, valign, scale, color) {
    var size = 5;
    var letterSize = size * scale;
    var lines = text.split ('\n');
    var linesCopy = lines.slice (0);
    var lineCount = lines.length;
    var longestLine = linesCopy.sort (function (a, b) {
      return b.length - a.length;
    })[0];
    var textWidth =
      longestLine.length * letterSize + (longestLine.length - 1) * hspacing;
    var textHeight = lineCount * letterSize + (lineCount - 1) * vspacing;

    if (!halign) halign = 'left';
    if (!valign) valign = 'bottom';

    var sx = x, sy = y, ex = x + textWidth, ey = y + textHeight;

    if (halign == 'center') {
      sx = x - textWidth / 2;
      ex = x + textWidth / 2;
    } else if (halign == 'right') {
      sx = x - textWidth;
      ex = x;
    }

    if (valign == 'center') {
      sy = y - textHeight / 2;
      ey = y + textHeight / 2;
    } else if (valign == 'bottom') {
      sy = y - textHeight;
      ey = y;
    }

    var cx = sx + textWidth / 2, cy = sy + textHeight / 2;

    for (var i = 0; i < lineCount; i++) {
      var line = lines[i];
      var lineWidth = line.length * letterSize + (line.length - 1) * hspacing;
      var lx = x;
      var ly = y + (letterSize + vspacing) * i;

      if (halign == 'center') {
        lx = x - lineWidth / 2;
      } else if (halign == 'right') {
        lx = x - lineWidth;
      }

      if (valign == 'center') {
        ly = y - textHeight / 2;
      } else if (valign == 'bottom') {
        ly = y - textHeight;
      }

      this.textLine (
        line,
        lx,
        ly,
        hspacing,
        vspacing,
        halign,
        valign,
        scale,
        color
      );
    }

    return {
      sx: sx,
      sy: sy,
      cx: cx,
      cy: cy,
      ex: ex,
      ey: ey,
      width: textWidth,
      height: textHeight,
    };
  }
}

export default RetroBuffer;
