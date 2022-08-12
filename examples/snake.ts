import { SnakeMap, VecState } from 'snake-rs';

import { Color, buttonBufferIndexToButtonId, hDJRecvEvent, hDJMidiRecv } from '../src';
import { memory } from "snake-rs/snake_rs_bg.wasm";

// let { memory } = require('snake-rs/snake_rs_bg.wasm');

let h = new hDJMidiRecv();

console.log("available devices:");
console.log(h.enumeratePorts());
h.on(hDJRecvEvent.MatrixEvent, (data) => {
    console.log("[main, matrix_event]", data);
});

h.on(hDJRecvEvent.ButtonPress, (data) => {
    console.log("[main, button_press]", data);
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

    // let mem = new WebAssembly.Memory();


    /*let map = new Uint8Array(memory.buffer, snake.buffer_address(), 8 * 8);
    let mapped = map.map((val: VecState) => {
        return val == VecState.ON ? Model.Color.GREEN3 : Model.Color.OFF
    });*/

    // console.log(mapped);

    h.boundBuffer.flush();
    h.boundBuffer.set(i, [Color.RED3]);
    i = (i + 1) % (8 * 8);

    j = (j + 1) % 8;
    let note = buttonBufferIndexToButtonId(j);
    //console.log(button);
    h.boundBuffer.setButton(Color.GREEN3, note);
}, 100);