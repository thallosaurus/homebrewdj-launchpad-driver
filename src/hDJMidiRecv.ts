import midi, { input } from 'midi';
import * as a from './hDJRecvModel';
import {EventEmitter} from 'events';

export namespace Receiver { 

    /**
     * Responsible for communication between the hardware. Decodes Messages and translates them to homebrewDJ commands
     *
     * @class hDJMidiRecv
     */
    export class hDJMidiRecv extends EventEmitter {

        private midiSender: midi.Input = new midi.Input();
        private midiReturn: midi.Output = new midi.Output();
        private buffer: hDJMidiOutputBuffer = new hDJMidiOutputBuffer();
        private frameTime: number = 0;

        get boundBuffer() {
            return this.buffer;
        }

        constructor() {
            super();
            //define what happens on a midi message
            this.midiSender.on('message', (deltaTime, message) => {
                let djCmd = this.parseMidi(message);
                this.frameTime += deltaTime;
                
                //Log to console
                //console.log("[hDJMidiRecv]", deltaTime, message, djCmd);
                
                if (djCmd.matrix) {
                    if (djCmd.type == a.Receiver.MessageType.NOTE_ON) {
                        //console.log("[hDJMidiRecv]", fromXY(djCmd.pos!));
                        //this.buffer.setXY(a.Receiver.getRandomNumber(), djCmd.pos!);
                        this.emit(a.Receiver.hDJRecvEvent.MatrixEvent, {
                            ...djCmd.pos,
                            time: this.frameTime,
                            ...this,
                            ...djCmd,

                        })
                    }
                    //echo(djCmd);
                } else {
                    let isKeyDown = djCmd.type == a.Receiver.MessageType.NOTE_ON;

                    this.emit(
                        isKeyDown
                        ? a.Receiver.hDJRecvEvent.ButtonPress
                        : a.Receiver.hDJRecvEvent.ButtonRelease, {
                        time: this.frameTime,
                        ...this,
                        ...djCmd,

                    });
                    //switch (djCmd.button) {
/*                        case a.Receiver.ButtonId.RECORDARM:
                            //console.log("flush");
                            //this.buffer.flush();

                            break;
                        default:
                            console.log(djCmd.button + " was pressed");
                            break;
                    }*/
                }
            });

            this.buffer.on("data", (data) => {
                for (let msg of data) {
                    this.midiReturn.send(msg);
                }
            });
        }

        /**
         * Returns a map containing the MIDI Port ID and the name of the port (alias the Device Name)
         *
         * @returns {PortEnumerationMap}
         * @memberof hDJMidiRecv
         */
        enumeratePorts(): a.Receiver.PortEnumerationMap
        {
            let inputs = [] as a.Receiver.PortEnumeration[];
            for (let i = 0; i < this.midiSender.getPortCount(); i++) {
                inputs.push({
                    port: i,
                    name: this.midiSender.getPortName(i)
                });
            }

            let outputs = [] as a.Receiver.PortEnumeration[];
            for (let i = 0; i < this.midiReturn.getPortCount(); i++) {
                outputs.push({
                    port: i,
                    name: this.midiSender.getPortName(i)
                });
            }

            return {
                input: inputs,
                output: outputs
            };
        }

        /**
         * Connect the Midi receiver to this specified ports
         * @param input 
         * @param output 
         */
        connect(inputPort: number, outputPort: number): void {
            this.midiSender.openPort(inputPort);
            this.midiReturn.openPort(outputPort);
        }

        /**
         * parses the midi message
         * @param {number[]} msg The Midi Message received from node-midi
         * @memberof hDJMidiRecv
         * @todo
         */
        private parseMidi(msg: number[]): a.Receiver.hDJRecvCmd {
            const typeRaw = msg[0];
            const port = msg[0] & 0b00001111;
            const note = msg[1];
            const velo = msg[2];

            let type;

            if (typeRaw == a.Receiver.MessageType.NOTE_ON) {
                if (velo == 0) {
                    type = a.Receiver.MessageType.NOTE_OFF;
                } else {
                    type = a.Receiver.MessageType.NOTE_ON;
                }
            } else {
                type = typeRaw;
            } 

            return {
                pos: getButtonCoordinates(note),
                type: type,
                velocity: velo,
                matrix: isXY(note),
                button: note as a.Receiver.ButtonId
            }
        }
    }

    /**
     * Closure for getting the coordinate from a Midi Message
     * @param note 
     * @returns 
     */
    function getButtonCoordinates(note: number): a.Receiver.hDJRecvCoord | null {
        let x = Math.floor(note / 16);
        let y = note % 16;

        return isXY(note) ? { x, y } : null;
    }

    /**
     * returns Index calculated from a position object
     *
     * @param {a.Receiver.hDJRecvCoord} pos
     * @param {number} [width=16] if set, it will calculate based on this width
     * @return {*}  {number}
     */
    function fromXY(pos: a.Receiver.hDJRecvCoord, width: number = 16): number
    {
        return pos.x * width + pos.y;
    }

    /**
     * Returns true, if the pressed button was inside the 8x8 matrix
     * false, if the press was outside
     *
     * @param {number} note
     * @returns {boolean}
     */
    function isXY(note: number): boolean
    {
        return (note % 16 < 8);
    }

    class hDJMidiOutputBuffer extends EventEmitter {
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
            this.buffer.fill(a.Receiver.Color.OFF);
            this.buttonBuffer.fill(a.Receiver.Color.OFF);
            this.emit("data", this.mapAsMidiMessages());
        }

        /**
         * Set Data on the Buffer on their 2d position
         *
         * @param {number} data
         * @param {a.Receiver.hDJRecvCoord} pos
         * @memberof hDJMidiOutputBuffer
         */
        setXY(data: number, pos: a.Receiver.hDJRecvCoord): void {
            let index = fromXY(pos, 8);
            //console.log(data, index);
            this.buffer.set([data], index);
            //console.log("[hDJMidiOutputBuffer]", this.buffer);
            this.emit("data", this.mapAsMidiMessages());
        }
        
        setButton(data: number, button: a.Receiver.ButtonId) {
            let mappedIndex = a.Receiver.buttonIdToButtonBufferIndex(button)
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

            return this.buffer.at(index)!;
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
        copy(from: ArrayLike<number>, pos: a.Receiver.hDJRecvCoord): void {
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

                    const d = [a.Receiver.MessageType.NOTE_ON, note, velocity];

                    b.push(d);
                }
            }

            //add button states
            let buttonIds = Object.values(a.Receiver.ButtonId);
            //console.log(buttonIds);
            for (let i = 0; i < this.buttonBuffer.length; i++) {
                const note = buttonIds[i] as a.Receiver.ButtonId;  //button selector
                const velocity = this.buttonBuffer[i];  //color

                let enumIndex = a.Receiver.ButtonId[note];

                //console.log(enumIndex);

                //console.log(note, velocity);

                const d = [a.Receiver.MessageType.NOTE_ON, enumIndex, velocity];

                b.push(d);
            }

            return b;
        }
    }
}