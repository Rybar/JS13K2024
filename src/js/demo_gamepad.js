import RetroBuffer from './core/RetroBuffer.js';
import { resizeCanvas } from './core/utils.js';

document.body.style = "margin:0; background-color:black; overflow:hidden";
const w = 480, h = 270;
const atlasURL = 'DATAURL:src/img/palette.webp';
const atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function () {
    let c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    let ctx = c.getContext('2d');
    ctx.drawImage(this, 0, 0);
    const atlas = new Uint32Array(ctx.getImageData(0, 0, 64, 64).data.buffer);
    const r = new RetroBuffer(w, h, atlas, 10);
    window.r = r;
    document.body.appendChild(r.c);
    initGamepadTester(r);
    resizeCanvas(r.c, w, h);
};

function initGamepadTester(buffer) {
  const gamepads = navigator.getGamepads();

  function updateGamepadStatus() {
    const connectedGamepads = navigator.getGamepads().filter(gp => gp !== null);
    connectedGamepads.forEach((gamepad, index) => {
      displayGamepad(buffer, gamepad, index);
    });
  }

  function displayGamepad(buffer, gamepad, index) {
    const xOffset = index * 240; // Increase spacing for multiple gamepads
    const yOffset = 20;

    // Draw gamepad silhouette
    drawGamepadSilhouette(buffer, xOffset, yOffset);

    // Draw buttons in a typical gamepad layout
    const buttonPositions = [
      { x: 180, y: 60 }, // Button 0 (A)
      { x: 200, y: 40 }, // Button 1 (B)
      { x: 160, y: 40 }, // Button 2 (X)
      { x: 180, y: 20 }, // Button 3 (Y)
      { x: 80, y: 20 },  // Button 4 (LB)
      { x: 240, y: 20 }, // Button 5 (RB)
      { x: 80, y: 180 }, // Button 6 (LT)
      { x: 240, y: 180 },// Button 7 (RT)
      { x: 130, y: 100 },// Button 8 (Select)
      { x: 210, y: 100 },// Button 9 (Start)
      { x: 130, y: 140 },// Button 10 (Left Stick Press)
      { x: 210, y: 140 },// Button 11 (Right Stick Press)
    ];

    gamepad.buttons.forEach((button, i) => {
      const pos = buttonPositions[i];
      if (pos) {
        const color = button.pressed ? 4 : 2;
        buffer.fillRect(xOffset + pos.x, yOffset + pos.y, 15, 15, color);
      }
    });

    // Draw analog sticks
    const leftStick = { x: 100, y: 140 }; // Left stick
    const rightStick = { x: 280, y: 140 }; // Right stick
    const stickRadius = 20;

    // Left stick
    buffer.circle(xOffset + leftStick.x, yOffset + leftStick.y, stickRadius, 1);
    const leftStickX = xOffset + leftStick.x + gamepad.axes[0] * stickRadius;
    const leftStickY = yOffset + leftStick.y + gamepad.axes[1] * stickRadius;
    buffer.fillRect(leftStickX - 2, leftStickY - 2, 4, 4, 3);

    // Right stick
    buffer.circle(xOffset + rightStick.x, yOffset + rightStick.y, stickRadius, 1);
    const rightStickX = xOffset + rightStick.x + gamepad.axes[2] * stickRadius;
    const rightStickY = yOffset + rightStick.y + gamepad.axes[3] * stickRadius;
    buffer.fillRect(rightStickX - 2, rightStickY - 2, 4, 4, 3);
  }

  function drawGamepadSilhouette(buffer, xOffset, yOffset) {
    const color = 1;

    // Draw the outline of the gamepad using line statements
    buffer.line(xOffset + 50, yOffset + 50, xOffset + 70, yOffset + 20, color); // Left handle
    buffer.line(xOffset + 70, yOffset + 20, xOffset + 150, yOffset + 20, color); // Top left
    buffer.line(xOffset + 150, yOffset + 20, xOffset + 170, yOffset + 50, color); // Right handle
    buffer.line(xOffset + 170, yOffset + 50, xOffset + 170, yOffset + 190, color); // Right side
    buffer.line(xOffset + 170, yOffset + 190, xOffset + 150, yOffset + 220, color); // Bottom right
    buffer.line(xOffset + 150, yOffset + 220, xOffset + 70, yOffset + 220, color); // Bottom
    buffer.line(xOffset + 70, yOffset + 220, xOffset + 50, yOffset + 190, color); // Bottom left
    buffer.line(xOffset + 50, yOffset + 190, xOffset + 50, yOffset + 50, color); // Left side

    // Draw inner details if desired
    // For simplicity, let's draw a couple of lines to represent the inner details
    buffer.line(xOffset + 110, yOffset + 50, xOffset + 110, yOffset + 190, color); // Center vertical line
    buffer.line(xOffset + 70, yOffset + 120, xOffset + 150, yOffset + 120, color); // Center horizontal line
  }

  function mainLoop() {
    buffer.clear(0, 0);
    updateGamepadStatus();
    buffer.render();
    requestAnimationFrame(mainLoop);
  }

  mainLoop();
}
