import { hDJMidiRecv, hDJMidiOutputBuffer, getRandomColor, ButtonId, Color, getButtonIdsAsArray } from "../src";

let h = new hDJMidiRecv();
console.log("AAaAaaAAAAAAAAAAAAAAAA");

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

//For example, we use input 0 and output 0
h.connect(1, 1);

h.on("matrix_event_press", (data) => {
    console.log("Someone pressed the matrix at", data.pos);
});

h.on("button_press", (data) => {
    console.log("Someone pressed the button", data.button);
    //console.log(ButtonId[data.button]);
});


const loop = () => {
    //Fill a new Array with some random colors
    let data = new Uint8Array(hDJMidiOutputBuffer.width * hDJMidiOutputBuffer.height).map(e => {
        return getRandomColor();
    });
    //h.boundBuffer.flush();
    h.boundBuffer.setXY(Array.from(data), {
        x: 0,
        y: 0
    });

    for (let id of getButtonIdsAsArray()) {
        h.boundBuffer.setButton(getRandomColor(), id);
    }
}

setInterval(loop, 250);
loop();