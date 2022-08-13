import { hDJMidiRecv, hDJMidiOutputBuffer, getRandomColor, ButtonId, Color } from "../src";

let h = new hDJMidiRecv();

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

//For example, we use input 0 and output 0
h.connect(0, 0);

h.on("matrix_event", (data) => {
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
    h.boundBuffer.flush();
    /*for (let y = 0; y < hDJMidiOutputBuffer.height; y++) {
        for (let x = 0; x < hDJMidiOutputBuffer.width; x++) {
            let i = x * hDJMidiOutputBuffer.height + y;

            //write buffer onto transfer buffer
            h.boundBuffer.setXY(data[i], {
                x: x,
                y: y
            });
            console.log(x, y);
        }
    }*/

    h.boundBuffer.setXY(Array.from(data), {
        x: 0,
        y: 0
    });

    h.boundBuffer.setButton(Color.GREEN3, ButtonId.VOLUME);
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.PAN);
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.SENDA);
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.SENDB);
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.STOP);
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.MUTE);
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.SOLO);   //Dont Work
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.RECORDARM);  //Dont Work
    //h.boundBuffer.setButton(Color.GREEN3, ButtonId.ARROW_UP);  //Dont Work
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.ARROW_DOWN);  //Dont Work
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.ARROW_LEFT);  //Dont Work
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.ARROW_RIGHT);  //Dont Work
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.SESSION);  //Dont Work
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.USER1);  //Turns Solo on?
//    h.boundBuffer.setButton(Color.GREEN3, ButtonId.USER2);  //Dont Work
    h.boundBuffer.setButton(Color.GREEN3, ButtonId.MIXER);  //Turns Record Arm on?

}

setInterval(loop, 1000);
loop();