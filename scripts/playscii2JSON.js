const fs = require('fs');

// Function to read the input file and convert to desired JSON format
function convertPlaysciiToJSON(inputFile, outputFile) {
  fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading input file:', err);
      return;
    }

    // Parse the input data
    const inputData = JSON.parse(data);

    // Extract width, height, and tiles data from the first frame, first layer
    const width = inputData.width;
    const height = inputData.height;
    const tiles = inputData.frames[0].layers[0].tiles;

    // Prepare the output data structure
    const outputData = {
      width: width,
      height: height,
      data: []
    };

    // Extract char, fg, bg from each tile and push to data array
    tiles.forEach(tile => {
      outputData.data.push(tile.char, tile.fg, tile.bg);
    });

    // Write the output data to the output file
    fs.writeFile(outputFile, JSON.stringify(outputData, null, 2), (err) => {
      if (err) {
        console.error('Error writing output file:', err);
        return;
      }
      console.log('Conversion successful! Output written to', outputFile);
    });
  });
}

// Get the input and output filenames from the command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node playscii2JSON.js <input.psci> <output.json>');
  process.exit(1);
}

const [inputFile, outputFile] = args;

// Convert the PlaySCII file to JSON format
convertPlaysciiToJSON(inputFile, outputFile);
