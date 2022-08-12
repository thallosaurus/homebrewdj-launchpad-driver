import * as midi from 'midi';
import {
    ButtonId,
    buttonIdToButtonBufferIndex,
    Color,
    hDJRecvCmd,
    hDJRecvCoord,
    hDJRecvEvent,
    isButton,
    MessageType,
    PortEnumeration,
    PortEnumerationMap
} from './hDJMidiRecvModel';
import { EventEmitter } from 'events';
import { hDJMidiOutputBuffer } from './hDJMidiOutputBuffer';

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
            //console.log("[hDJMidiRecv]", deltaTime, message, djCmd);

            if (djCmd.matrix) {
                if (djCmd.type == MessageType.NOTE_ON) {
                    this.emit(hDJRecvEvent.MatrixEvent, {
                        ...djCmd.pos,
                        time: this.frameTime,
                        ...this,
                        ...djCmd,
                    });
                }
            } else {
                //test
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

        this.buffer.on("data", (data: any) => {
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
        const typeExtracted = msg[0] & 0b11110000;

        let note = msg[1];
        const velo = msg[2];        

        //console.log("Message on Port " + (port + 1));

        if (typeExtracted == MessageType.CC && note == ButtonId.SOLO) {
            note = ButtonId.ARROW_UP;
        }

        let type;

        if (typeExtracted != MessageType.CC) {
            if (velo == 0) {
                type = MessageType.NOTE_OFF;
            } else {
                type = MessageType.NOTE_ON;
            }
        } else {
            //fallback
            type = velo > 0 ? MessageType.NOTE_ON : MessageType.NOTE_OFF;
        }

        return {
            port: port,
            pos: getButtonCoordinates(note),
            type: type,
            velocity: velo,
            matrix: !isButton(note),
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

    return !isButton(note) ? { x, y } : null;
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
    return (note % 16 < 8) && Object.keys(ButtonId).includes(note.toString());
}