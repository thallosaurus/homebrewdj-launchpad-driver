# homebrewdj-launchpad-driver - Launchpad Mini (MK2) Driver for Node from homebrewDJ (TBA)

## About
This Module implements a Interface between a Launchpad Mini MK2 and Javascript Events with node-midi. See the example below on how to use this module

## Installation
### From NPM
```npm i homebrewdj-launchpad-driver```

### From Source
```npm i https://github.com/thallosaurus/homebrewdj-launchpad-driver.git```

## Requirements
Be sure that you have this installed beforehand the installationprocess will fail
- OSX
  - Some version of Xcode (or Command Line Tools)
  - Python (for node-gyp)

- Windows
    -   Microsoft Visual C++ (the Express edition works fine)
    -   Python (for node-gyp)

- Linux
    - A C++ compiler
    - You must have installed and configured ALSA. Without it this module will NOT build.
    - Install the libasound2-dev package.
    - Python (for node-gyp)

If you use Windows, you can also use ```npm install --global windows-build-tools```

## Examples
```javascript
const { hDJMidiRecv, hDJRecvEvent, Colors } = require("homebrewdj-launchpad-driver");

let h = new hDJMidiRecv();

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

//For example, we use input 0 and output 0
h.connect(0, 0);

h.on(hDJRecvEvent.MatrixEvent, (data) => {
    console.log("Someone pressed the matrix at", data.pos);
});

h.on(ButtonPress, (data) => {
    console.log("Someone pressed the button", data.button);
});

//Writing some data to the launchpad
let data = new Uint8Array(8 * 8);
data.fill(Colors.GREEN3);

h.boundBuffer.setXY(data, {
    x: 0,
    y: 0
});
```

# TODO
- Get Upper Button Row working