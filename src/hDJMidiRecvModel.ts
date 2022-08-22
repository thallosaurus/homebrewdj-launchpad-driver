import * as midi from 'midi';

/**
 * Represents a Port with its id and Name
 *
 * @export
 * @interface PortEnumeration
 */
export interface PortEnumeration {
    port: number,
    name: String
}

/**
 * Output of hDJMidiRecv.enumeratePorts()
 *
 * @export
 * @interface PortEnumerationMap
 */
export interface PortEnumerationMap {
    input: PortEnumeration[],
    output: PortEnumeration[]
}

/**
 * Represents a point in the matrix, 2D
 *
 * @export
 * @interface hDJRecvCoord
 */
export interface hDJRecvCoord {
    x: number;
    y: number;
}

/**
 * MIDI Message Types
 *
 * @export
 * @enum {number}
 */
export enum MessageType {
    NOTE_ON = 0x90,
    NOTE_OFF = 0x80,
    CC = 0xB0
}

/**
 * Represents a message sent by hDJMidiRecv
 *
 * @export
 * @interface hDJRecvCmd
 */
export interface hDJRecvCmd {
    time: number;
    port: number;
    pos: hDJRecvCoord | null;
    type: MessageType;
    velocity: number | Color;
    matrix: boolean;
    button: ButtonId | null;
}

/**
 * Contains all IDs for the launchpad buttons
 *
 * @export
 * @enum {number}
 */
export enum ButtonId {
    ARROW_UP = 121,
    ARROW_DOWN = 105,
    ARROW_LEFT = 106,
    ARROW_RIGHT = 107,
    SESSION = 108,
    USER1 = 109,
    USER2 = 110,
    MIXER = 111,
    VOLUME = 8,
    PAN = 24,
    SENDA = 40,
    SENDB = 56,
    STOP = 72,
    MUTE = 88,
    SOLO = 104,
    RECORDARM = 120
}

/**
 * Returns if the pressed button is a round button
 *
 * @export
 * @param {number} note
 * @return {*}  {boolean}
 */
export function isButton(note: number): boolean {
    return ButtonId[note] != undefined;
}

/**
 * Converts a buttonBuffer index back to its ButtoId enum value
 * @param index 
 * @returns 
 */
export function buttonBufferIndexToButtonId(index: number): ButtonId {
    switch (index) {
        case 0:
            return ButtonId.VOLUME;
        case 1:
            return ButtonId.PAN;
        case 2:
            return ButtonId.SENDA;
        case 3:
            return ButtonId.SENDB;
        case 4:
            return ButtonId.STOP;
        case 5:
            return ButtonId.MUTE;
        case 6:
            return ButtonId.SOLO;
        case 7:
            return ButtonId.RECORDARM;
        case 8:
            return ButtonId.ARROW_UP;
        case 9:
            return ButtonId.ARROW_DOWN;
        case 10:
            return ButtonId.ARROW_LEFT;
        case 11:
            return ButtonId.ARROW_RIGHT;
        case 12:
            return ButtonId.SESSION;
        case 13:
            return ButtonId.USER1;
        case 14:
            return ButtonId.USER2;
        case 15:
            return ButtonId.MIXER;
        default:
            return -2;
    };
}

/**
 * Converts a ButtonId to its corresponding buttonBuffer index
 *
 * @export
 * @param {ButtonId} n
 * @returns
 */
export function buttonIdToButtonBufferIndex(id: ButtonId): number {
    switch (id) {
        case ButtonId.VOLUME:
            return 0;
        case ButtonId.PAN:
            return 1;
        case ButtonId.SENDA:
            return 2;
        case ButtonId.SENDB:
            return 3;
        case ButtonId.STOP:
            return 4;
        case ButtonId.MUTE:
            return 5;
        case ButtonId.SOLO:
            return 6;
        case ButtonId.RECORDARM:
            return 7;
        case ButtonId.ARROW_UP:
            return 8;
        case ButtonId.ARROW_DOWN:
            return 9;
        case ButtonId.ARROW_LEFT:
            return 10;
        case ButtonId.ARROW_RIGHT:
            return 11;
        case ButtonId.SESSION:
            return 12;
        case ButtonId.USER1:
            return 13;
        case ButtonId.USER2:
            return 14;
        case ButtonId.MIXER:
            return 15;
    };
}

/**
 * Launchpad Colors defined as velocity
 *
 * @export
 * @enum {number}
 */
export enum Color {
    OFF = 0,
    RED1 = 1,
    RED2 = 2,
    RED3 = 3,
    YELLOW1 = 17,
    YELLOW2 = 33,
    YELLOW3 = 50,
    YELLOWGREEN = 49,
    ORANGE1 = 18,
    ORANGE2 = 19,
    ORANGE3 = 34,
    ORANGE4 = 35,
    ORANGE5 = 51,
    GREEN1 = 16,
    GREEN2 = 32,
    GREEN3 = 48,
}

/**
 * Returns a random value from the Color enum
 *
 * @export
 * @returns {Color}
 */
export function getRandomColor(): Color {
    const enumValues = Object.values(Color).filter(e => {
        return Number(e) && e != 0
    });
    const index = Math.floor(Math.random() * enumValues.length);

    return enumValues[index] as Color;
}

export function hardcodedCorrectionButtonMap(message: number[]): number[] {

    let oldValue = message[1];

    switch (oldValue) {
        case ButtonId.ARROW_UP:
            return [176, 104, message[2]];

        case ButtonId.SOLO:
            return [144, 104, message[2]];

        case ButtonId.RECORDARM:
            return [144, 120, message[2]];

        default:
            return message;
    }
}

export function getSpecialButtonIdsAsArray() {
    return [
        ButtonId.ARROW_UP,
        ButtonId.ARROW_DOWN,
        ButtonId.ARROW_LEFT,
        ButtonId.ARROW_RIGHT,
        ButtonId.SESSION,
        ButtonId.USER1,
        ButtonId.USER2,
        ButtonId.MIXER,
    ];
}

export function getButtonIdsAsArray() {
    return [
        ...getSpecialButtonIdsAsArray(),
        ButtonId.VOLUME,
        ButtonId.PAN,
        ButtonId.SENDA,
        ButtonId.SENDB,
        ButtonId.STOP,
        ButtonId.MUTE,
        ButtonId.SOLO,
        ButtonId.RECORDARM
    ];
}

/**
 * Events sent from hDJMidiRecvModel
 *
 * @export
 * @interface hDJMidiEvents
 */
export interface hDJMidiEvents {

    /**
     * Event declaration for matrix press event
     *
     * @memberof hDJMidiEvents
     */
    'matrix_event_press': (data: hDJRecvCmd) => void;

    /**
     * Event declaration for matrix release event
     *
     * @memberof hDJMidiEvents
     */
    'matrix_event_release': (data: hDJRecvCmd) => void;

    /**
     * Event declaration for button presses
     *
     * @memberof hDJMidiEvents
     */
    'button_press': (data: hDJRecvCmd) => void;

    /**
     * Event declaration for button releases
     *
     * @memberof hDJMidiEvents
     */
    'button_release': (data: hDJRecvCmd) => void,
}