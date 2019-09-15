"use strict";


import { CubeSlice } from "./config";



export class CubeAction {
    constructor(
        public readonly slice: CubeSlice,
        public readonly angle: number
    ) {}

    invert() {
        return new CubeAction(this.slice, -this.angle);
    }
}
