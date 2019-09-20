"use strict";



export const enum Axis {
    X = 0,
    Y = 2,
    Z = 4
}



export const enum Face {
    Left,
    Right,
    Bottom,
    Top,
    Back,
    Front,

    Axis = 6,
    Positive = 1
}



export const enum CubeColor {
    Blue,
    Green,
    White,
    Yellow,
    Orange,
    Red
}



export class CubeConfig {
    public readonly data: Int8Array;

    constructor(public readonly size: number, data?: Int8Array) {
        if (data) {
            this.data = data.slice();
        } else {
            this.data = new Int8Array(this.size * this.size * 6);
            for (let i = 0; i < this.data.length; ++i) {
                this.data[i] = Math.floor(i / (size * size));
            }
        }
    }

    clone() {
        return new CubeConfig(this.size, this.data);
    }

    isSolved() {
        let pitch = this.size * this.size;
        for (let o = 0; o < 6 * pitch; o += pitch) {
            for (let i = 1; i < pitch; ++i) {
                if (this.data[o + i] != this.data[o]) {
                    return false;
                }
            }
        }
        return true;
    }
}
