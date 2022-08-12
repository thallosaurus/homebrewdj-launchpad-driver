import { Model } from "./hDJRecvModel";
import midi from 'midi';
import {EventEmitter} from 'events';
import { Receiver } from './hDJMidiRecv';

export namespace Buffer {
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
            this.buffer.fill(Model.Color.OFF);
            this.buttonBuffer.fill(Model.Color.OFF);
            this.emit("data", this.mapAsMidiMessages());
        }

        /**
         * Set Data on the Buffer on their 2d position
         *
         * @param {number} data
         * @param {Model.hDJRecvCoord} pos
         * @memberof hDJMidiOutputBuffer
         */
        setXY(data: number, pos: Model.hDJRecvCoord): void {
            let index = Receiver.fromXY(pos, 8);
            //console.log(data, index);
            this.buffer.set([data], index);
            //console.log("[hDJMidiOutputBuffer]", this.buffer);
            this.emit("data", this.mapAsMidiMessages());
        }

        setButton(data: number, button: Model.ButtonId) {
            let mappedIndex = Model.buttonIdToButtonBufferIndex(button)
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
            let index = Receiver.fromXY({
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
        copy(from: ArrayLike<number>, pos: Model.hDJRecvCoord): void {
            let index = Receiver.fromXY(pos, 8);
            this.buffer.set(from, index)
        }

        private mapAsMidiMessages(): midi.MidiMessage[] {
            let b = new Array();

            for (let y = 0; y < hDJMidiOutputBuffer.height; y++) {
                for (let x = 0; x < hDJMidiOutputBuffer.width; x++) {
                    const note = Receiver.fromXY({
                        x: x,
                        y: y
                    });

                    const velocity = this.getXY(x, y);

                    const d = [Model.MessageType.NOTE_ON, note, velocity];

                    b.push(d);
                }
            }

            //add button states
            let buttonIds = Object.values(Model.ButtonId);
            //console.log(buttonIds);
            for (let i = 0; i < this.buttonBuffer.length; i++) {
                const note = buttonIds[i] as Model.ButtonId;  //button selector
                const velocity = this.buttonBuffer[i];  //color

                let enumIndex = Model.ButtonId[note];

                const d = [Model.MessageType.NOTE_ON, enumIndex, velocity];

                b.push(d);
            }

            return b;
        }
    }
}