import { Receiver } from "../src/hDJMidiRecv";
import { Receiver as Model} from "../src/hDJRecvModel";
import { SnakeMap, VecState } from 'snake-rs';
import { memory } from "snake-rs/snake_rs_bg.wasm";

// memory
// import fs from 'fs';
// console.log(WebAssembly.Memory);

/* bootstraps everything here */

let h = new Receiver.hDJMidiRecv();

// console.log("available devices:");
// console.log(h.enumeratePorts());
h.on(Model.hDJRecvEvent.MatrixEvent, (data) => {
    //console.log("[main]", data);
    console.log("[main, matrix_event]", "is matrix press");
});

h.on(Model.hDJRecvEvent.ButtonPress, (data) => {
    console.log("[main, button_press]", data);
    //console.log("[main]", "is button press", Model.ButtonId.RECORDARM == data.button);
});

let i = 0;

let x = 0;
let y = 0;

let j = 0;

// h.connect(0, 0);

let snake = SnakeMap.new(8, 8);

setInterval(() => {
    //console.log(i);
    
    /* h.boundBuffer.setXY(Model.Color.RED3, {
        x: x,
        y: y
    }); */
    snake.tick();

    //WebAssembly.instantiate()

    //let mapCopy = new Uint8Array(WebAssembly.Memory, snake.buffer_address(), 8 * 8);


    /*let map = new Uint8Array(memory.buffer, snake.buffer_address(), 8 * 8);
    let mapped = map.map((val: VecState) => {
        return val == VecState.ON ? Model.Color.GREEN3 : Model.Color.OFF
    });*/

    h.boundBuffer.flush();
    h.boundBuffer.set(i, [Model.Color.RED3]);
    i = (i + 1) % (8 * 8);

    j = (j + 1) % 8;
    let note = Model.buttonBufferIndexToButtonId(j);
    //console.log(button);
    h.boundBuffer.setButton(Model.Color.GREEN3, note);
}, 100);