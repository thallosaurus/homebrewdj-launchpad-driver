import * as midi from 'midi';
import {
    ButtonId,
    buttonIdToButtonBufferIndex,
    Color,
    hDJRecvCmd,
    hDJRecvCoord,
    hDJRecvEvent,
    MessageType,
    PortEnumeration,
    PortEnumerationMap
} from './hDJMidiRecvModel';
import { EventEmitter } from 'events';

/**
 * Responsible for communication between the hardware. Decodes Messages and translates them to hDJMidiRecv events
 *
 * @class hDJMidiRecv
 */
export class hDJMidiRecv extends EventEmitter {

    /**
     * MIDI-Port responsible for sending to the launchpad
     *
     * @private
     * @type {midi.Input}
     * @memberof hDJMidiRecv
     */
    private midiSender: midi.Input = new midi.Input();

    /**
     * MIDI-Port responsible for receiving data from the launchpad
     *
     * @private
     * @type {midi.Output}
     * @memberof hDJMidiRecv
     */
    private midiReturn: midi.Output = new midi.Output();

    /**
     * Buffer for XY-Area of the Launchpad
     *
     * @private
     * @type {hDJMidiOutputBuffer}
     * @memberof hDJMidiRecv
     */
    private buffer: hDJMidiOutputBuffer = new hDJMidiOutputBuffer();

    /**
     * Timestamp. Delta Time gets added with each midi message
     *
     * @private
     * @type {number}
     * @memberof hDJMidiRecv
     */
    private frameTime: number = 0;

    /**
     * exposes the buffer bound to the controller matrix.
     * writes with the specified setter are reflected instantly
     *
     * @readonly
     * @memberof hDJMidiRecv
     */
    get boundBuffer() {
        return this.buffer;
    }

    constructor() {
        super();
        //define what happens on a midi message
        this.midiSender.on('message', (deltaTime: number, message: number[]) => {
            let djCmd = this.parseMidi(message);
            this.frameTime += deltaTime;

            //Log to console
            console.log("[hDJMidiRecv]", deltaTime, message, djCmd);

            if (djCmd.matrix) {
                if (djCmd.type == MessageType.NOTE_ON) {
                    this.emit(hDJRecvEvent.MatrixEvent, {
                        ...djCmd.pos,
                        time: this.frameTime,
                        ...this,
                        ...djCmd,

                    })
                }
            } else {
                let isKeyDown = djCmd.type == MessageType.NOTE_ON || (djCmd.type == MessageType.CC && djCmd.velocity > 0);

                this.emit(
                    isKeyDown
                        ? hDJRecvEvent.ButtonPress
                        : hDJRecvEvent.ButtonRelease, {
                    time: this.frameTime,
                    ...this,
                    ...djCmd,
                });
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
    enumeratePorts(): PortEnumerationMap {
        let inputs = [] as PortEnumeration[];
        for (let i = 0; i < this.midiSender.getPortCount(); i++) {
            inputs.push({
                port: i,
                name: this.midiSender.getPortName(i)
            });
        }

        let outputs = [] as PortEnumeration[];
        for (let i = 0; i < this.midiReturn.getPortCount(); i++) {
            outputs.push({
                port: i,
                name: this.midiReturn.getPortName(i)
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
    private parseMidi(msg: number[]): hDJRecvCmd {
        const typeRaw = msg[0];
        const port = msg[0] & 0b00001111;
        const note = msg[1];
        const velo = msg[2];

        let type;

        if (typeRaw == MessageType.NOTE_ON) {
            if (velo == 0) {
                type = MessageType.NOTE_OFF;
            } else {
                type = MessageType.NOTE_ON;
            }
        } else {
            type = typeRaw;
        }

        return {
            pos: getButtonCoordinates(note),
            type: type,
            velocity: velo,
            matrix: isXY(note),
            button: note as ButtonId
        }
    }
}

/**
 * Closure for getting the coordinate from a Midi Message
 * @param note 
 * @returns 
 */
function getButtonCoordinates(note: number): hDJRecvCoord | null {
    let x = Math.floor(note / 16);
    let y = note % 16;

    return isXY(note) ? { x, y } : null;
}

/**
 * returns Index calculated from a position object
 *
 * @param {hDJRecvCoord} pos
 * @param {number} [width=16] if set, it will calculate based on this width
 * @return {*}  {number}
 */
export function fromXY(pos: hDJRecvCoord, width: number = 16): number {
    return pos.x * width + pos.y;
}

/**
 * Returns true, if the pressed button was inside the 8x8 matrix
 * false, if the press was outside
 *
 * @param {number} note
 * @returns {boolean}
 */
function isXY(note: number): boolean {
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
