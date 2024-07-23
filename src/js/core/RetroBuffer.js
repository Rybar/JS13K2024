/**
 * RetroBuffer class for creating indexed-color drawing API for pixel-art games.
 */
class RetroBuffer {
  /**
   * Creates an instance of RetroBuffer.
   * @param {number} width - The width of the buffer.
   * @param {number} height - The height of the buffer.
   * @param {Uint32Array} atlas - The color atlas.
   * @param {number} pages - The number of pages in the buffer.
   */
  constructor(width, height, atlas, pages) {
      this.WIDTH = width;
      this.HEIGHT = height;
      this.PAGESIZE = this.WIDTH * this.HEIGHT;
      this.PAGES = pages;
      this.atlas = atlas;

      this.SCREEN = 0;
      for (let i = 1; i <= this.PAGES; i++) {
          this[`PAGE_${i}`] = this.PAGESIZE * i;
      }

      // Relative drawing position and pencolor, for drawing functions that require it.
      this.cursorX = 0;
      this.cursorY = 0;
      this.cursorColor = 23;
      this.cursorColor2 = 25;
      this.stencil = false;
      this.stencilSource = this.PAGE_2;
      this.stencilOffset = 0;

      this.colors = this.atlas.slice(0, 64);

      // Default palette index
      this.palDefault = Array.from({ length: 64 }, (_, i) => i);

      this.c = document.createElement('canvas');
      this.c.width = this.WIDTH;
      this.c.height = this.HEIGHT;
      this.ctx = this.c.getContext('2d');
      this.renderTarget = 0x00000;
      this.renderSource = this.PAGESIZE; // Buffer is ahead one screen's worth of pixels

      this.fontString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()";

      // Base64 encoded font bitmap
      this.fontBitmapBase64 = "/H8Y+j6PvwhB/JRj78OQ/+HIQ/C8fxj+MfkIT/xCl6MuSjCEIfjusYxzWcXRjF3oy5B0Yyf6PoxfBwffIQhIxjF0YxUSMa1dFRFRiohCfERHyMIRzoiJ/wTB9KXxC/DwfPh6LvhEQjoui50Xhc6MYuAAAPkIQBPxvW6vq+oAAAIYRAA2mQAOiYBAiIiAiIIIRCEE"
      // Decode Base64 string to binary data and store as a typed array
      const binaryString = atob(this.fontBitmapBase64);
      this.fontBitmap = new Uint8Array(binaryString.length * 8);
      for (let i = 0; i < binaryString.length; i++) {
          let byte = binaryString.charCodeAt(i);
          for (let bit = 0; bit < 8; bit++) {
              this.fontBitmap[i * 8 + bit] = (byte >> (7 - bit)) & 1;
          }
      }

      this.pal = Array.from({ length: 65 }, (_, i) => i);

      // Hard-coded dither table
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

      this.pat = 0b1111111111111111;

      this.ctx.imageSmoothingEnabled = false;

      this.imageData = this.ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT);
      this.buf = new ArrayBuffer(this.imageData.data.length);
      this.buf8 = new Uint8Array(this.buf);
      this.data = new Uint32Array(this.buf);
      this.ram = new Uint8Array(this.WIDTH * this.HEIGHT * this.PAGES);

      // Brightness LUT
      this.brightness = [];
      for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 64; j++) {
              this.brightness[i * 64 + j] = this.colors.indexOf(this.atlas[i * 64 + j]);
          }
      }
  }

  /**
   * Clears the buffer with the specified color.
   * @param {number} color - The color to clear the buffer with.
   * @param {number} page - The page to clear.
   */
  clear(color, page) {
      this.ram.fill(color, page, page + this.PAGESIZE);
  }

  /**
   * Sets the pen color for drawing.
   * @param {number} color - The primary color.
   * @param {number} color2 - The secondary color.
   * @param {number} [dither=0] - The dither pattern.
   */
  setPen(color, color2, dither = 0) {
      this.cursorColor = color;
      this.cursorColor2 = color2;
      this.pat = dither;
  }

  /**
   * Sets a pixel at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {number} color - The color of the pixel.
   * @param {number} [color2=64] - The secondary color.
   */
  pset(x, y, color, color2 = 64) {
      x = x | 0;
      y = y | 0;
      color = this.stencil ? this.pget(x, y, this.stencilSource) + this.stencilOffset : (color | 0) % 64;
      let px = (y % 4) * 4 + (x % 4);
      let mask = this.pat & Math.pow(2, px);
      let pcolor = mask ? color : color2;
      if (pcolor == 64) return;
      if (x < 0 || x > this.WIDTH - 1) return;
      if (y < 0 || y > this.HEIGHT - 1) return;

      this.ram[this.renderTarget + y * this.WIDTH + x] = pcolor;
  }

  /**
   * Gets the color of the pixel at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {number} [page=0] - The page to read from.
   * @returns {number} - The color of the pixel.
   */
  pget(x, y, page = 0) {
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
  line(x1, y1, x2, y2, color) {
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

      this.pset(x1, y1, color);
      if (dx > dy) {
          var fraction = dy - (dx >> 1);
          while (x1 != x2) {
              if (fraction >= 0) {
                  y1 += stepy;
                  fraction -= dx;
              }
              x1 += stepx;
              fraction += dy;
              this.pset(x1, y1, color);
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
              this.pset(x1, y1, color);
          }
      }
  }

  /**
   * Draws a transformed line between two points.
   * @param {number} x1 - The x-coordinate of the first point.
   * @param {number} y1 - The y-coordinate of the first point.
   * @param {number} x2 - The x-coordinate of the second point.
   * @param {number} y2 - The y-coordinate of the second point.
   * @param {number} offsetX - The x-offset for the transformation.
   * @param {number} offsetY - The y-offset for the transformation.
   * @param {number} colorOffset - The color offset for the transformation.
   */
  tline(x1, y1, x2, y2, offsetX = 0, offsetY = 0, colorOffset = 0) {
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

      var x = x1, y = y1;
      var fraction = dy - (dx >> 1);
      while (x != x2) {
          if (fraction >= 0) {
              y += stepy;
              fraction -= dx;
          }
          x += stepx;
          fraction += dy;
          this.pset(x, y, this.pget(x - offsetX, y - offsetY, this.renderSource) + colorOffset);
      }
  }

  /**
   * Draws a circle.
   * @param {number} xm - The x-coordinate of the center of the circle.
   * @param {number} ym - The y-coordinate of the center of the circle.
   * @param {number} r - The radius of the circle.
   * @param {number} color - The color of the circle.
   */
  circle(xm, ym, r, color) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      color = color | 0;
      var x = -r, y = 0, err = 2 - 2 * r;
      do {
          this.pset(xm - x, ym + y, color);
          this.pset(xm - y, ym - x, color);
          this.pset(xm + x, ym - y, color);
          this.pset(xm + y, ym + x, color);
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
  fillCircle(xm, ym, r, color) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      color = color | 0;
      if (r < 0) return;
      var x = -r, y = 0, err = 2 - 2 * r;
      do {
          this.line(xm - x, ym - y, xm + x, ym - y, color);
          this.line(xm - x, ym + y, xm + x, ym + y, color);
          r = err;
          if (r <= y) err += ++y * 2 + 1;
          if (r > x || err > y) err += ++x * 2 + 1;
      } while (x < 0);
  }

  /**
   * Fills a transformed circle.
   * @param {number} xm - The x-coordinate of the center of the circle.
   * @param {number} ym - The y-coordinate of the center of the circle.
   * @param {number} r - The radius of the circle.
   * @param {number} [colorOffset=0] - The color offset for the transformation.
   */
  tfillCircle(xm, ym, r, colorOffset = 0) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      var offX = xm - mw;
      var offY = ym - mh;
      if (r < 0) return;
      var x = -r, y = 0, err = 2 - 2 * r;
      do {
          this.tline(xm - x, ym - y, xm + x, ym - y, offX, offY, colorOffset);
          this.tline(xm - x, ym + y, xm + x, ym + y, offX, offY, colorOffset);
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
  rect(x, y, w, h, color) {
      color = color | this.cursorColor;
      let x1 = x | 0;
      let y1 = y | 0;
      let x2 = (x + w) | 0;
      let y2 = (y + h) | 0;

      this.line(x1, y1, x2, y1, color);
      this.line(x2, y1, x2, y2, color);
      this.line(x1, y2, x2, y2, color);
      this.line(x1, y1, x1, y2, color);
  }

  /**
   * Fills a rectangle.
   * @param {number} x - The x-coordinate of the top-left corner of the rectangle.
   * @param {number} y - The y-coordinate of the top-left corner of the rectangle.
   * @param {number} w - The width of the rectangle.
   * @param {number} h - The height of the rectangle.
   * @param {number} color - The color of the rectangle.
   */
  fillRect(x, y, w, h, color) {
      let x1 = x | 0;
      let y1 = y | 0;
      let x2 = ((x + w) | 0) - 1;
      let y2 = ((y + h) | 0) - 1;
      color = color;

      var i = Math.abs(y2 - y1);
      this.line(x1, y1, x2, y1, color);

      if (i > 0) {
          while (--i) {
              this.line(x1, y1 + i, x2, y1 + i, color);
          }
      }

      this.line(x1, y2, x2, y2, color);
  }

  /**
   * Draws a sprite.
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
  sspr(sx = 0, sy = 0, sw = 16, sh = 16, x = 0, y = 0, dw = 32, dh = 32, flipx = false, flipy = false) {
      var xratio = sw / dw;
      var yratio = sh / dh;
      this.pat = this.dither[0]; // Reset pattern
      for (var i = 0; i < dh; i++) {
          for (var j = 0; j < dw; j++) {
              let px = (j * xratio) | 0;
              let py = (i * yratio) | 0;
              sy = flipy ? (sh - py - i) : sy;
              sx = flipx ? (sw - px - j) : sx;
              let source = this.pget(sx + px, sy + py, this.renderSource);
              if (source > 0) {
                  this.pset(x + j, y + i, source);
              }
          }
      }
  }

  /**
   * Outlines a shape.
   * @param {number} renderSource - The source page for rendering.
   * @param {number} renderTarget - The target page for rendering.
   * @param {number} color - The color of the outline.
   * @param {number} color2 - The secondary color.
   * @param {number} color3 - The tertiary color.
   * @param {number} color4 - The quaternary color.
   */
  outline(renderSource, renderTarget, color, color2, color3, color4) {
      for (let i = 0; i <= this.WIDTH; i++) {
          for (let j = 0; j <= this.HEIGHT; j++) {
              let left = i - 1 + j * this.WIDTH;
              let right = i + 1 + j * this.WIDTH;
              let bottom = i + (j + 1) * this.WIDTH;
              let top = i + (j - 1) * this.WIDTH;
              let current = i + j * this.WIDTH;

              if (this.ram[this.renderSource + current]) {
                  if (this.ram[this.renderSource + left] == 64) {
                      this.ram[this.renderTarget + left] = color;
                  }
                  if (this.ram[this.renderSource + right] == 64) {
                      this.ram[this.renderTarget + right] = color3;
                  }
                  if (this.ram[this.renderSource + top] == 64) {
                      this.ram[this.renderTarget + top] = color2;
                  }
                  if (this.ram[this.renderSource + bottom] == 64) {
                      this.ram[this.renderTarget + bottom] = color4;
                  }
              }
          }
      }
  }

  /**
   * Draws a triangle.
   * @param {Object} p1 - The first point of the triangle.
   * @param {number} p1.x - The x-coordinate of the first point.
   * @param {number} p1.y - The y-coordinate of the first point.
   * @param {Object} p2 - The second point of the triangle.
   * @param {number} p2.x - The x-coordinate of the second point.
   * @param {number} p2.y - The y-coordinate of the second point.
   * @param {Object} p3 - The third point of the triangle.
   * @param {number} p3.x - The x-coordinate of the third point.
   * @param {number} p3.y - The y-coordinate of the third point.
   * @param {number} color - The color of the triangle.
   */
  triangle(p1, p2, p3, color) {
      this.line(p1.x, p1.y, p2.x, p2.y, color);
      this.line(p2.x, p2.y, p3.x, p3.y, color);
      this.line(p3.x, p3.y, p1.x, p1.y, color);
  }

  /**
   * Fills a triangle.
   * @param {Object} p1 - The first point of the triangle.
   * @param {number} p1.x - The x-coordinate of the first point.
   * @param {number} p1.y - The y-coordinate of the first point.
   * @param {Object} p2 - The second point of the triangle.
   * @param {number} p2.x - The x-coordinate of the second point.
   * @param {number} p2.y - The y-coordinate of the second point.
   * @param {Object} p3 - The third point of the triangle.
   * @param {number} p3.x - The x-coordinate of the third point.
   * @param {number} p3.y - The y-coordinate of the third point.
   * @param {number} color - The color of the triangle.
   */
  fillTriangle(p1, p2, p3, color) {
      let P = [Object.assign({}, p1), Object.assign({}, p2), Object.assign({}, p3)].sort((a, b) => a.y - b.y);
      let A = P[0], B = P[1], C = P[2],
          dx1 = 0, dx2 = 0, dx3 = 0,
          S = {}, E = {};

      if (B.y - A.y > 0) dx1 = (B.x - A.x) / (B.y - A.y);
      if (C.y - A.y > 0) dx2 = (C.x - A.x) / (C.y - A.y);
      if (C.y - B.y > 0) dx3 = (C.x - B.x) / (C.y - B.y);

      Object.assign(S, A);
      Object.assign(E, A);
      if (dx1 > dx2) {
          for (; S.y <= B.y; S.y++, E.y++, S.x += dx2, E.x += dx1) {
              this.line(S.x, S.y, E.x, S.y, color);
          }
          E = B;
          for (; S.y <= C.y; S.y++, E.y++, S.x += dx2, E.x += dx3) {
              this.line(S.x, S.y, E.x, S.y, color);
          }
      } else {
          for (; S.y <= B.y; S.y++, E.y++, S.x += dx1, E.x += dx2) {
              this.line(S.x, S.y, E.x, S.y, color);
          }
          S = B;
          for (; S.y <= C.y; S.y++, E.y++, S.x += dx3, E.x += dx2) {
              this.line(S.x, S.y, E.x, S.y, color);
          }
      }
  }

  /**
   * Loads an image into the buffer.
   * @param {HTMLImageElement} image - The image to load.
   * @param {number} address - The address in the buffer to load the image into.
   */
  imageToRam(image, address) {
      let tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.WIDTH;
      tempCanvas.height = this.HEIGHT;
      let context = tempCanvas.getContext('2d');
      context.drawImage(image, 0, 0);

      let imageData = context.getImageData(0, 0, this.WIDTH, this.HEIGHT);
      let data = new Uint32Array(imageData.data.buffer);

      for (var i = 0; i < data.length; i++) {
          this.ram[address + i] = this.colors.indexOf(data[i]);
      }
  }

  /**
   * Renders the buffer to the canvas.
   */
  render() {
      var i = this.PAGESIZE;

      while (i--) {
          if (i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];
      }

      this.imageData.data.set(this.buf8);
      this.c.width = this.c.width;
      this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   * Gets the binary representation of a character.
   * @param {string} char - The character to get.
   * @returns {Uint8Array} - The binary representation of the character.
   */
  getCharacter(char) {
      let index = this.fontString.indexOf(char);
      let start = index * 25;
      let end = start + 25;
      return this.fontBitmap.slice(start, end);
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
  textLine(text, x, y, hspacing, vspacing, halign, valign, scale, color) {
      var textLength = text.length;
      var size = 5;

      for (var i = 0; i < textLength; i++) {
          var letter = this.getCharacter(text.charAt(i));

          for (var yi = 0; yi < size; yi++) {
              for (var xi = 0; xi < size; xi++) {
                  if (letter[yi * size + xi] == 1) {
                      if (scale == 1) {
                          this.pset(
                              x + (xi * scale) + ((size * scale) + hspacing) * i,
                              y + (yi * scale),
                              color
                          );
                      } else {
                          this.fillRect(
                              x + (xi * scale) + ((size * scale) + hspacing) * i,
                              y + (yi * scale),
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
  text(text, x, y, hspacing, vspacing, halign, valign, scale, color) {
      var size = 5;
      var letterSize = size * scale;
      var lines = text.split('\n');
      var linesCopy = lines.slice(0);
      var lineCount = lines.length;
      var longestLine = linesCopy.sort(function (a, b) {
          return b.length - a.length;
      })[0];
      var textWidth = (longestLine.length * letterSize) + ((longestLine.length - 1) * hspacing);
      var textHeight = (lineCount * letterSize) + ((lineCount - 1) * vspacing);

      if (!halign) halign = 'left';
      if (!valign) valign = 'bottom';

      var sx = x,
          sy = y,
          ex = x + textWidth,
          ey = y + textHeight;

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

      var cx = sx + textWidth / 2,
          cy = sy + textHeight / 2;

      for (var i = 0; i < lineCount; i++) {
          var line = lines[i];
          var lineWidth = (line.length * letterSize) + ((line.length - 1) * hspacing);
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

          this.textLine(line, lx, ly, hspacing, vspacing, halign, valign, scale, color);
      }

      return {
          sx: sx,
          sy: sy,
          cx: cx,
          cy: cy,
          ex: ex,
          ey: ey,
          width: textWidth,
          height: textHeight
      }
  }
}

export default RetroBuffer;
