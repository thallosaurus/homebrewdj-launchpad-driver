import { Color, hDJMidiRecv, hDJMidiOutputBuffer, ButtonId, getRandomColor, hDJRecvCoord } from '../src';

export namespace MicroSnake {
    /**
     * Definitions for the Snake Game Directions
     *
     * @export
     * @enum {number}
     */
    export enum MSDirection {
        /**
         * Up Direction
         */
        UP,

        /**
         * Down Direction
         */
        DOWN,

        /**
         * Left Direction
         */
        LEFT,

        /**
         * Right Direction
         */
        RIGHT
    }

    /**
     * MicroSnake Part. A single block of the snake
     *
     * @export
     * @interface MSPart
     */
    export interface MSPart {
        /**
         * The X Coordinate of the Snake Part
         *
         * @type {number}
         * @memberof MSPart
         */
        x: number;

        /**
         * The Y Coordinate of the Snake Part
         *
         * @type {number}
         * @memberof MSPart
         */
        y: number;
    }

    /**
     * The Implementation of snake written for this demo
     *
     * @export
     * @class Game
     */
    export class Game {

        /**
         * The Players X Position
         *
         * @private
         * @type {number}
         * @memberof Game
         */
        private x: number;

        /**
         * The Players Y Position
         *
         * @private
         * @type {number}
         * @memberof Game
         */
        private y: number;

        /**
         * The X Position of where the Snack is placed
         *
         * @private
         * @type {number}
         * @memberof Game
         */
        private snackX: number;

        /**
         * The Y Position of where the Snack is placed
         *
         * @private
         * @type {number}
         * @memberof MicroSnake
         */
        private snackY: number;

        /**
         * Width of the Game-Field
         *
         * @private
         * @type {number}
         * @memberof Game
         */
        private width: number;

        /**
         * Height of the Game-Field
         *
         * @private
         * @type {number}
         * @memberof Game
         */
        private height: number;

        /**
         * Current direction the snake is heading
         *
         * @private
         * @type {MSDirection}
         * @memberof Game
         */
        private direction: MSDirection = MSDirection.UP;

        /**
         * The Array Holding all the Parts of the snake. The last Part gets popped,
         * its coordinates changed and then inserted at the front of the array
         *
         * @private
         * @type {MSPart[]}
         * @memberof Game
         */
        private parts: MSPart[];

        /**
         * The current Color of the Snake.
         * Gets changed after every eaten Snack
         *
         * @private
         * @type {Color}
         * @memberof Game
         */
        private color: Color;

        /**
         * Internal Counter for gained Points. Not used right now
         *
         * @private
         * @type {number}
         * @memberof MicroSnake
         */
        private points: number;

        /**
         * Getter for the Snack Position as typed Coordinate Object
         *
         * @readonly
         * @type {hDJRecvCoord}
         * @memberof Game
         */
        get snackPos(): hDJRecvCoord {
            return {
                x: this.snackX,
                y: this.snackY,
            };
        }

        /**
         * Getter for the Buffer of the Game Map.
         * Returns the Game Map parsed as typed 8-Bit Integer Number Array
         *
         * @readonly
         * @type {Uint8Array}
         * @memberof Game
         */
        get buffer(): Uint8Array {
            let buf = new hDJMidiOutputBuffer();
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    let part = this.parts.filter((e) => {
                        return e.x == x && e.y == y
                    }).pop();
                    let shouldDrawX = [
                        this.snackX,
                        part?.x,
                    ].includes(x);

                    let shouldDrawY = [
                        part?.y,
                        this.snackY,
                    ].includes(y);

                    //console.log(x, y, shouldDrawX, shouldDrawY);

                    if (shouldDrawX && shouldDrawY) {
                        buf.setXY([this.color], {
                            x: x,
                            y: y
                        }, 1);
                    }
                }
            }

            return buf.buffer;
        }

        /**
         * Generates random Coordinates
         *
         * @private
         * @return {*} 
         * @memberof Game
         */
        private getRandomCoords(): hDJRecvCoord {
            let rndX = Math.floor(Math.random() * this.width);
            let rndY = Math.floor(Math.random() * this.height);

            return {
                x: rndX,
                y: rndY
            };
        }

        /**
         * Returns a random direction
         *
         * @private
         * @return {*}  {number}
         * @memberof Game
         */
        private getRandomDirection(): number {
            let rnd = Math.floor(Math.random() * 4);
            return rnd;
        }

        /**
         * Creates an instance of MicroSnake.Game.
         * @param {number} w The Width of the Field
         * @param {number} h The Height of the Field
         * @memberof Game
         */
        constructor(w: number, h: number) {
            this.width = w;
            this.height = h;
            let rndStartPos = this.getRandomCoords();
            this.x = rndStartPos.x;
            this.y = rndStartPos.y;
            let rndSnackPos = this.getRandomCoords();
            this.snackX = rndSnackPos.x;
            this.snackY = rndSnackPos.y;
            this.direction = this.getRandomDirection();
            this.color = getRandomColor();
            this.parts = new Array();
            this.parts.push({
                x: this.x,
                y: this.y
            });

            this.points = 0;
        }

        /**
         * Resets the Game to a clean state
         *
         * @memberof Game
         */
        reset() {
            let rndStartPos = this.getRandomCoords();
            this.x = rndStartPos.x;
            this.y = rndStartPos.y;

            let rndSnackPos = this.getRandomCoords();
            this.snackX = rndSnackPos.x;
            this.snackY = rndSnackPos.y;
            this.direction = this.getRandomDirection();
            this.color = getRandomColor();

            this.parts = new Array();
            this.parts.push({
                x: this.x,
                y: this.y
            });
            this.points = 0;
        }

        /**
         * Reads the Direction Variable and updates the Position Variables
         *
         * @private
         * @memberof Game
         */
        private processDirection() {
            switch (this.direction) {

                case MSDirection.UP:
                    this.x = this.x == 0 ? this.height - 1 : --this.x;
                    break;

                case MSDirection.DOWN:
                    this.x = (this.x + 1) % this.height;
                    break;

                case MSDirection.LEFT:
                    this.y = this.y == 0 ? this.width - 1 : --this.y;
                    break;

                case MSDirection.RIGHT:
                    this.y = (this.y + 1) % this.width;
                    break;
            }
        }

        /**
         * Does the following things:
         * 
         * 1. Processes the Direction
         * 2. Pops the last element of the Parts array to the Accumulator
         * 3. Checks, if the snake is about to eat itself
         * 4. If it is about to eat itself, reset the game
         * 5. If the Snack is about to be eaten
         * 6. Create a copy of the Accumulator
         * 7. Set a new random color
         * 8. Add the new Snake Part to the Accumulator
         * 9. Randomize Snack Position
         * 10. Then Update the Accumulator and update the SnakePart Map
         * 
         *
         * @memberof Game
         */
        tick() {
            this.processDirection();

            let accumulator = this.parts.pop()!;

            let r = this.parts.find((v, i) => {
                return v.x == this.x && v.y == this.y;
            });

            if (r) {
                this.reset();
            }

            if (this.snackX == this.x && this.snackY == this.y) {
                //has eaten snack
                let newPart: MSPart = {
                    x: accumulator.x,
                    y: accumulator.y,
                };
                this.color = getRandomColor();

                this.parts.push(newPart);

                let rndX = Math.floor(Math.random() * this.width);
                let rndY = Math.floor(Math.random() * this.height);
                this.snackX = rndX;
                this.snackY = rndY;
            }

            accumulator.x = this.x;
            accumulator.y = this.y;


            this.parts = [accumulator, ...this.parts];
        }

        /**
         * Set the new position of the Snake to be UP
         *
         * @memberof Game
         */
        up() {
            if (this.direction != MSDirection.DOWN) {
                this.direction = MSDirection.UP;
            }
        }

        /**
         * Set the new position of the Snake to be DOWN
         *
         * @memberof Game
         */
        down() {
            if (this.direction != MSDirection.UP) {
                this.direction = MSDirection.DOWN;
            }
        }

        /**
         * Set the new position of the Snake to be LEFT
         *
         * @memberof Game
         */
        left() {
            if (this.direction != MSDirection.RIGHT) {
                this.direction = MSDirection.LEFT;
            }
        }

        /**
         * Set the new position of the Snake to be RIGHT
         *
         * @memberof Game
         */
        right() {
            if (this.direction != MSDirection.LEFT) {
                this.direction = MSDirection.RIGHT;
            }
        }
    }
}

export const main = () => {

    let h = new hDJMidiRecv();
    let snake = new MicroSnake.Game(8, 8);

    let running = true;

    console.log("available devices:");
    console.log(h.enumeratePorts());
    h.on("matrix_event_press", (data) => {
        console.log("[main, matrix_event]", snake.snackPos);
        if (data.pos!.x == snake.snackPos.x && data.pos!.y == snake.snackPos.y) {
            running = !running;
        }
    });

    h.on("button_press", (data) => {
        switch (data.button) {
            case ButtonId.ARROW_UP:
                snake.up();
                break;
            case ButtonId.ARROW_DOWN:
                snake.down();
                break;
            case ButtonId.ARROW_LEFT:
                snake.left();
                break;
            case ButtonId.ARROW_RIGHT:
                snake.right();
                break;
            case ButtonId.RECORDARM:
                snake.reset();
                break;
        }
    });

    let i = 0;
    let j = 0;

    h.connect(1, 1);

    setInterval(() => {
        if (running) {
            h.boundBuffer.flush();
            snake.tick();
        }
        h.boundBuffer.setXY(Array.from(snake.buffer), {
            x: 0,
            y: 0
        }, 8);
    }, 250);
}
