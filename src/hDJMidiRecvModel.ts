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
    pos: hDJRecvCoord | null;
    type: MessageType;
    velocity: number | Color;
    matrix: boolean;
    button: ButtonId | null;
}

/**
 * represents a hardware action
 *
 * @export
 * @enum {number}
 */
export enum hDJRecvEvent {
    MatrixEvent = "matrix_event",
    ButtonPress = "button_press",
    ButtonRelease = "button_release"
}

/**
 * Contains all IDs for the launchpad buttons
 *
 * @export
 * @enum {number}
 */
export enum ButtonId {
    ARROW_UP = 112,
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
 * Converts a ButtonId to its corresponding buttonBuffer index
 *
 * @export
 * @param {ButtonId} n
 * @returns
 */
export function buttonIdToButtonBufferIndex(n: ButtonId) {
    return Object.keys(ButtonId).indexOf(n.toString());
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
            return ButtonId.SENDB;
        case 5:
            return ButtonId.STOP;
        case 6:
            return ButtonId.MUTE;
        case 7:
            return ButtonId.SOLO;
        case 8:
            return ButtonId.RECORDARM;
        default:
            return ButtonId.ARROW_DOWN;
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
    console.log(enumValues);
    const index = Math.floor(Math.random() * enumValues.length);

    return enumValues[index] as Color;
}