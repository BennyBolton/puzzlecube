"use strict";


import { Vector } from "./vector";
import { Line } from "./line";



export class Plane {
    constructor(
        public readonly point: Vector,
        public readonly normal: Vector
    ) {}

    distanceTo(line: Line) {
        let den = this.normal.dot(line.direction);
        return this.point.add(line.point, -1).dot(this.normal) / den;
    }
}
