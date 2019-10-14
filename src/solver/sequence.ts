"use strict";


import { CubeOrientation, Face } from "../model";



class SequenceMove {
    constructor(
        private readonly face: Face,
        private readonly angle: number,
        private readonly start: number,
        private readonly end: number
    ) {}

    getLength() {
        return Math.abs(this.angle) * (this.end - this.start + 1);
    }

    *getActions(cube: CubeOrientation) {
        for (let i = this.start; i <= this.end; ++i) {
            yield cube.getAction(this.face, i, this.angle);
        }
    }
}



export class Sequence {
    private static regex = /([LRDUBF])(2|'|\((-?[0-9]+)\))?(\+([0-9]+)(:([0-9]+))?)?/g;

    private readonly moves = [] as SequenceMove[];

    constructor(spec: string, ...args: string[]) {
        Sequence.regex.lastIndex = 0;
        let match: ReturnType<RegExp["exec"]> = null;
        while (match = Sequence.regex.exec(spec)) {
            let face = Face.Left, angle = 1, start = 0, end = 0;
            switch (match[1]) {
                case "L": face = Face.Left; break;
                case "R": face = Face.Right; break;
                case "D": face = Face.Bottom; break;
                case "U": face = Face.Top; break;
                case "B": face = Face.Back; break;
                case "F": face = Face.Front; break;
            }
            switch (match[2] && match[2][0]) {
                case "2": angle = 2; break;
                case "'": angle = -1; break;
                case "(": angle = +match[3]; break;
            }
            if (match[5]) {
                start = end = +match[5];
                if (match[7]) end = +match[7];
            }
            this.moves.push(new SequenceMove(face, angle, start, end));
        }
    }

    getLength() {
        let length = 0;
        for (let move of this.moves) {
            length += move.getLength();
        }
        return length;
    }

    *getActions(cube: CubeOrientation) {
        for (let move of this.moves) {
            yield* move.getActions(cube);
        }
    }
}
