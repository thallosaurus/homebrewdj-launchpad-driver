//import { ButtonId, Color, fromXY, hDJMidiRecv, hDJRecvCoord } from "homebrewdj-launchpad-driver";
/* Data Models */

import { Color, fromXY, hDJMidiOutputBuffer, hDJMidiRecv, hDJRecvCoord } from "../src";

/**
 * Holds methods for acting as a homebrewDJ Widget
 *
 * @interface hDJWidget
 * @extends {hDJRecvCoord}
 */
interface hDJWidget {
    width: number;
    height: number;
    getAsBuffer(): number[];
}

/**
 * Holds the color State for the control strip
 *
 * @interface hDJControlStripWidget
 * @extends {hDJWidget}
 */
interface hDJControlStripWidget extends hDJWidget {
    inverted: boolean;
    playing: boolean;
    controlStrip: hDJControlStripButton[];
}

class Deck implements hDJWidget {
    width: number = 4;
    height: number = 6;
    children: hDJWidget[] = [];

    constructor(inverted: boolean = false) {
        for (let i = 0; i < this.height; i++) {
            this.children.push(new StripWidget(i, inverted));
        }
    }
    getAsBuffer(): number[] {
        let b: number[] = [];

        for (let child of this.children) {
            b = [...child.getAsBuffer(), ...b];
        }

        return b;
    }
}

/**
 * Represents a ControlStripButton
 *
 * @enum {number}
 */
enum hDJControlStripButton {
    CUE1,
    CUE2,
    CUE3,
    TRACKSELECT
}

class StripWidget implements hDJControlStripWidget {
    inverted: boolean;
    playing: boolean;
    controlStrip: hDJControlStripButton[];
    width: number = 4;
    height: number = 1;

    //row: number;

    constructor(row: number, inverted: boolean) {
        //this.row = row;
        this.inverted = inverted;
        this.playing = false;
        if (this.inverted) {
            this.controlStrip = [
                hDJControlStripButton.TRACKSELECT,
                hDJControlStripButton.CUE1,
                hDJControlStripButton.CUE2,
                hDJControlStripButton.CUE3,
            ];
        } else
            this.controlStrip = [
                hDJControlStripButton.CUE1,
                hDJControlStripButton.CUE2,
                hDJControlStripButton.CUE3,
                hDJControlStripButton.TRACKSELECT,
            ];
    }
    getAsBuffer(): number[] {
        return this.controlStrip.map((e) => {
            return e == hDJControlStripButton.TRACKSELECT ? Color.RED3 : Color.ORANGE2;
        });
    }

}

/**
 * The main function. Have fun <3
 *
 */
function main() {
    const launchpad = new hDJMidiRecv();
    launchpad.connect(0, 0);

    let deck = new Deck();
    let deckLeft = new Deck(true);

    let data = deck.getAsBuffer();
    let dataL = deckLeft.getAsBuffer();

    launchpad.boundBuffer.setXY(data, {
        x: 0,
        y: 0
    }, deck.width);

    launchpad.boundBuffer.setXY(dataL, {
        x: 0,
        y: 4
    }, deckLeft.width);

    console.log(launchpad.boundBuffer);
}
main();