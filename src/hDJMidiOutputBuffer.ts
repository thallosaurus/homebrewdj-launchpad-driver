import { ButtonId, buttonIdToButtonBufferIndex, Color, hDJRecvCoord, MessageType } from "./hDJMidiRecvModel";
import * as midi from 'midi';
import EventEmitter from "events";
import { fromXY } from './hDJMidiRecv';

export class hDJMidiOutputBuffer extends EventEmitter {
    static readonly width = 8;
    static readonly height = 8;
    private readonly buffer: Uint8Array;
    private readonly buttonBuffer: Uint8Array;

    constructor() {
        super();
        this.buffer = new Uint8Array(hDJMidiOutputBuffer.width * hDJMidiOutputBuffer.height);
        this.buttonBuffer = new Uint8Array(16);
        this.flush();
    }

    /**
     * empties the buffer
     */
    flush(): void {
        this.buffer.fill(Color.OFF);
        this.buttonBuffer.fill(Color.OFF);
        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * Set Data on the Buffer on their 2d position
     *
     * @param {number} data
     * @param {hDJRecvCoord} pos
     * @memberof hDJMidiOutputBuffer
     */
    setXY(data: number, pos: hDJRecvCoord): void {
        let index = fromXY(pos, 8);
        //console.log(data, index);
        this.buffer.set([data], index);
        //console.log("[hDJMidiOutputBuffer]", this.buffer);
        this.emit("data", this.mapAsMidiMessages());
    }

    setButton(data: number, button: ButtonId) {
        let mappedIndex = buttonIdToButtonBufferIndex(button)
        this.buttonBuffer.set([data], mappedIndex);
        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * returns value on the specified position
     *
     * @param {number} x
     * @param {number} y
     * @return {*}  {number}
     * @memberof hDJMidiOutputBuffer
     */
    getXY(x: number, y: number): number {
        let index = fromXY({
            x: x,
            y: y
        }, 8);

        return this.buffer[index];
    }

    set(i: number, data: number[]) {
        this.buffer.set(data, i);
        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * copies values from another array into this buffer
     * @param from data
     * @param pos position of the upper left edge
     */
    copy(from: ArrayLike<number>, pos: hDJRecvCoord): void {
        let index = fromXY(pos, 8);
        this.buffer.set(from, index)
    }

    private mapAsMidiMessages(): midi.MidiMessage[] {
        let b = new Array();

        for (let y = 0; y < hDJMidiOutputBuffer.height; y++) {
            for (let x = 0; x < hDJMidiOutputBuffer.width; x++) {
                const note = fromXY({
                    x: x,
                    y: y
                });

                const velocity = this.getXY(x, y);

                const d = [MessageType.NOTE_ON, note, velocity];

                b.push(d);
            }
        }

        //add button states
        let buttonIds = Object.values(ButtonId);
        //console.log(buttonIds);
        for (let i = 0; i < this.buttonBuffer.length; i++) {
            const note = buttonIds[i] as ButtonId;  //button selector
            const velocity = this.buttonBuffer[i];  //color

            let enumIndex = ButtonId[note];

            const d = [MessageType.NOTE_ON, enumIndex, velocity];

            b.push(d);
        }

        return b;
    }
}