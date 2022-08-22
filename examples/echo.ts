import {
    hDJMidiRecv,
    hDJMidiOutputBuffer,
    ButtonId,
    Color
} from "../src";

let h = new hDJMidiRecv();

//Get all connected MIDI Devices
console.log("available devices:");
console.log(h.enumeratePorts());

h.connect(1, 1);
h.boundBuffer.flush();

h.boundBuffer.setButton(127, ButtonId.ARROW_UP);  //zeigt nichts
// => [176, 104, 127] / Momentan => [176, 121, 127]
h.boundBuffer.setButton(127, ButtonId.ARROW_DOWN); //works
h.boundBuffer.setButton(127, ButtonId.ARROW_LEFT); //works
h.boundBuffer.setButton(127, ButtonId.ARROW_RIGHT);  //works
h.boundBuffer.setButton(127, ButtonId.SESSION);  //works
h.boundBuffer.setButton(127, ButtonId.USER1);  //works
h.boundBuffer.setButton(127, ButtonId.USER2);  //works 
h.boundBuffer.setButton(127, ButtonId.MIXER);  //works

h.boundBuffer.setButton(127, ButtonId.VOLUME);
h.boundBuffer.setButton(127, ButtonId.PAN);
h.boundBuffer.setButton(127, ButtonId.SENDA);
h.boundBuffer.setButton(127, ButtonId.SENDB);
h.boundBuffer.setButton(127, ButtonId.STOP);
h.boundBuffer.setButton(127, ButtonId.MUTE);
h.boundBuffer.setButton(127, ButtonId.SOLO);        //=> ARROW UP
//=> [144, 104, 127]
h.boundBuffer.setButton(127, ButtonId.RECORDARM);   //=> ARROW_UP?

h.on("button_press", (data) => {
    console.log(data);
});