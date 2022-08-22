import { ButtonId, buttonIdToButtonBufferIndex, Color, getButtonIdsAsArray, hardcodedCorrectionButtonMap, hDJRecvCoord, MessageType } from "./hDJMidiRecvModel";
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
    private readonly buttonMap: Map<ButtonId, Color>;

    constructor() {
        super();
        this.buffer = new Uint8Array(hDJMidiOutputBuffer.width * hDJMidiOutputBuffer.height);
        //this.buttonBuffer = new Uint8Array(16);
        this.buttonMap = new Map<ButtonId, Color>();
        this.flush();
    }

    /**
     * Empties both button and matrix buffer
     *
     * @memberof hDJMidiOutputBuffer
     */
    flush(): void {
        this.buffer.fill(Color.OFF);

        for (let id of getButtonIdsAsArray()) {
            this.buttonMap.set(id, Color.OFF);
        }

        this.emit("data", this.mapAsMidiMessages());
    }

    /**
     * Set Data on the Buffer on their 2d position
     *
     * @param {number} data
     * @param {hDJRecvCoord} pos
     * @memberof hDJMidiOutputBuffer
     */
    setXY(data: number[], pos: hDJRecvCoord, width = hDJMidiOutputBuffer.width): void {
        let row = 0;
        
        while (data.length > 0) {
            let chunk = data.splice(0, width);
            let p = fromXY({
                x: row + pos.x,
                y: pos.y
            }, hDJMidiOutputBuffer.width);
            
            this.buffer.set(chunk, p);
            row++;
        };
        this.emit("data", this.mapAsMidiMessages());
    }

    setButton(data: Color, button: ButtonId) {
        this.buttonMap.set(button, data);
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

        for (let id of getButtonIdsAsArray()) {
            let color = this.buttonMap.get(id)!;
            let type = ((id < 100) ? (
                color == Color.OFF ? MessageType.NOTE_OFF : MessageType.NOTE_ON
            ) : MessageType.CC);

            let msg = [type, id, color];
            b.push(hardcodedCorrectionButtonMap(msg));
        }
        
        //add button states

        return b;
    }
}
