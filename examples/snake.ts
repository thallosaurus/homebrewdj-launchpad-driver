import { Color, hDJMidiRecv, hDJMidiOutputBuffer, ButtonId, getRandomColor, hDJRecvCoord } from '../src';

enum MSDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

interface MSPart {
    x: number;
    y: number;
}

class MicroSnake {
    private x: number;
    private y: number;
    private snackX: number;
    private snackY: number;
    private width: number;
    private height: number;
    private direction: MSDirection = MSDirection.UP;
    private parts: MSPart[];
    private color: Color;
    private points: number;

    get snackPos(): hDJRecvCoord {
        return {
            x: this.snackX,
            y: this.snackY,
        };
    }

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
                    });
                }
            }
        }

        return buf.buffer;
    }

    private getRandomCoords() {
        let rndX = Math.floor(Math.random() * this.width);
        let rndY = Math.floor(Math.random() * this.height);

        return {
            x: rndX,
            y: rndY
        };
    }

    private getRandomDirection() {
        let rnd = Math.floor(Math.random() * 4);
        return rnd;
    }

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

    up() {
        if (this.direction != MSDirection.DOWN) {
            this.direction = MSDirection.UP;
        }
    }

    down() {
        if (this.direction != MSDirection.UP) {
            this.direction = MSDirection.DOWN;
        }
    }

    left() {
        if (this.direction != MSDirection.RIGHT) {
            this.direction = MSDirection.LEFT;
        }
    }

    right() {
        if (this.direction != MSDirection.LEFT) {
            this.direction = MSDirection.RIGHT;
        }
    }
}

let h = new hDJMidiRecv();
let snake = new MicroSnake(8, 8);

let running = true;

console.log("available devices:");
console.log(h.enumeratePorts());
h.on("matrix_event", (data) => {
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

h.connect(0, 0);

// let snake = SnakeMap.new(8, 8);

setInterval(() => {
    h.boundBuffer.flush();
    if (running) {
        snake.tick();
    }
    h.boundBuffer.setXY(Array.from(snake.buffer), {
        x: 0,
        y: 0
    });
}, 250);
