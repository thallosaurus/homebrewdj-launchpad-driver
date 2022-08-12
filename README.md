# homebrewdj-launchpad-driver - Launchpad Mini (MK2) Driver for Node from homebrewDJ (TBA)

## About
This Module implements a Interface between a Launchpad Mini MK2 and Javascript Events with node-midi. See the example below on how to use this module

## Requirements
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
import { Receiver } from "../src/hDJMidiRecv";
import { Model } from "../src/hDJRecvModel";

let h = new Receiver.hDJMidiRecv();

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

//For example, we use input 0 and output 0
h.connect(0, 0);

h.on(Model.hDJRecvEvent.MatrixEvent, (data) => {
    console.log("Someone pressed the matrix at", data.pos);
});

h.on(Model.hDJRecvEvent.ButtonPress, (data) => {
    console.log("Someone pressed the button", data.button);
});

//Writing some data to the launchpad
let data = new Uint8Array(8 * 8);
data.fill(Model.Colors.GREEN3);

h.boundBuffer.setXY(data, {
    x: 0,
    y: 0
})
```

# TODO
- Get Upper Button Row working