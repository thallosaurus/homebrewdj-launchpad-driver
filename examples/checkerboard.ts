const { hDJMidiRecv, hDJRecvEvent, hDJMidiOutputBuffer, getRandomColor, ButtonId } = require("../src");

let h = new hDJMidiRecv();

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

//For example, we use input 0 and output 0
h.connect(0, 0);

h.on(hDJRecvEvent.MatrixEvent, (data: any) => {
    console.log("Someone pressed the matrix at", data.pos);
});

h.on(hDJRecvEvent.ButtonPress, (data: any) => {
    console.log("Someone pressed the button", data.button);
    console.log(ButtonId[data.button]);
});


const loop = () => {
    //Fill a new Array with some random colors
    let data = new Uint8Array(hDJMidiOutputBuffer.width * hDJMidiOutputBuffer.height).map(e => {
        return getRandomColor();
    });
    h.boundBuffer.flush();
    for (let y = 0; y < hDJMidiOutputBuffer.height; y++) {
        for (let x = 0; x < hDJMidiOutputBuffer.width; x++) {
            let i = x * hDJMidiOutputBuffer.height + y;

            //write buffer onto transfer buffer
            h.boundBuffer.setXY(data[i], {
                x: x,
                y: y
            });
            console.log(x, y);
        }
    }

    console.log("Loop");

}

setInterval(loop, 1000);
loop();