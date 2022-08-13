import { ButtonId, buttonIdToButtonBufferIndex, Color, hDJRecvCoord, MessageType } from "./hDJMidiRecvModel";
import * as midi from 'midi';
import EventEmitter from "events";
import { fromXY } from './hDJMidiRecv';

export declare interface hDJMidiOutputBuffer {
    on(event: 'data', listener: (data: midi.MidiMessage[]) => void): this;
}

/**
 * Contains Methods and Events for interacting with the launchpad LED Output
 *
 * @export
 * @class hDJMidiOutputBuffer
 * @extends {EventEmitter}
 */
export class hDJMidiOutputBuffer extends EventEmitter {

    /**
     * Count of the Width of the XY Area of the launchpad
     *
     * @static
     * @memberof hDJMidiOutputBuffer
     */
    static readonly width = 8;

    /**
     * Count of the Height of the XY Area of the launchpad
     *
     * @static
     * @memberof hDJMidiOutputBuffer
     */
    static readonly height = 8;

    /**
     * unbound Buffer Array, changes here don't reflect on the device. Use setXY or set
     *
     * @private
     * @type {Uint8Array}
     * @memberof hDJMidiOutputBuffer
     */
    readonly buffer: Uint8Array;

    /**
     * unbound Button Buffer Array, changes here don't reflect on the device. Use setButton
     *
     * @private
     * @type {Uint8Array}
     * @memberof hDJMidiOutputBuffer
     */
    private readonly buttonBuffer: Uint8Array;

    constructor() {
        super();
        this.buffer = new Uint8Array(hDJMidiOutputBuffer.width * hDJMidiOutputBuffer.height);
        this.buttonBuffer = new Uint8Array(16);
        this.flush();
    }

    /**
     * Empties both button and matrix buffer
     *
     * @memberof hDJMidiOutputBuffer
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
    setXY(data: number[], pos: hDJRecvCoord): void {
        let index = fromXY(pos, 8);
        this.buffer.set(data, index);
        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * Sets data of Button LED on buffer
     * @param data 
     * @param button 
     */
    setButton(data: number, button: ButtonId) {
        /*if (data == ButtonId.ARROW_UP) {
            data = ButtonId.SOLO;
        }*/
        
        let isCC = [
            ButtonId.ARROW_UP,
            ButtonId.ARROW_DOWN,
            ButtonId.ARROW_LEFT,
            ButtonId.ARROW_RIGHT,
            ButtonId.SESSION,
            //ButtonId.USER1,
            ButtonId.USER2,
            //ButtonId.MIXER,
        ].includes(button);
        
        if (isCC) throw new Error("Lighting is not supported for upper row right now, sorry!");
        
        /*if (isCC && button == ButtonId.ARROW_UP) {
            button = ButtonId.SOLO;
        }*/

        let mappedIndex = buttonIdToButtonBufferIndex(button);
        //fix
        //console.log(mappedIndex);
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

    /**
     * Set Data by Index on the buffer - emits
     *
     * @param {number} i
     * @param {number[]} data
     * @memberof hDJMidiOutputBuffer
     */
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
        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * Returns current buffers concatenated as individual Midi Messages
     *
     * @private
     * @returns {midi.MidiMessage[]}
     * @memberof hDJMidiOutputBuffer
     */
    private mapAsMidiMessages(isCC = false): midi.MidiMessage[] {
        let b = new Array();

        for (let y = 0; y < hDJMidiOutputBuffer.height; y++) {
            for (let x = 0; x < hDJMidiOutputBuffer.width; x++) {
                const note = fromXY({
                    x: x,
                    y: y
                });

                const velocity = this.getXY(x, y);

                const d = [isCC ? MessageType.CC : MessageType.NOTE_ON, note, velocity];

                b.push(d);
            }
        }

        //add button states
        let buttonIds = Object.values(ButtonId);
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