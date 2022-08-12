"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hDJMidiRecv_1 = require("../src/hDJMidiRecv");
const hDJRecvModel_1 = require("../src/hDJRecvModel");
const snake_rs_1 = require("snake-rs");
// import { memory } from "snake-rs/snake_rs_bg.wasm";
// let { memory } = require('snake-rs/snake_rs_bg.wasm');
/* bootstraps everything here */
let h = new hDJMidiRecv_1.Receiver.hDJMidiRecv();
console.log("available devices:");
console.log(h.enumeratePorts());
h.on(hDJRecvModel_1.Model.hDJRecvEvent.MatrixEvent, (data) => {
    console.log("[main, matrix_event]", data);
});
h.on(hDJRecvModel_1.Model.hDJRecvEvent.ButtonPress, (data) => {
    console.log("[main, button_press]", data);
});
let i = 0;
let x = 0;
let y = 0;
let j = 0;
// h.connect(0, 0);
let snake = snake_rs_1.SnakeMap.new(8, 8);
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
    h.boundBuffer.set(i, [hDJRecvModel_1.Model.Color.RED3]);
    i = (i + 1) % (8 * 8);
    j = (j + 1) % 8;
    let note = hDJRecvModel_1.Model.buttonBufferIndexToButtonId(j);
    //console.log(button);
    h.boundBuffer.setButton(hDJRecvModel_1.Model.Color.GREEN3, note);
}, 100);
//# sourceMappingURL=main.js.map