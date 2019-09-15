"use strict";


import { Vector } from "./vector";



export class Line {
    constructor(
        public readonly point: Vector,
        public readonly direction: Vector
    ) {}

    distanceTo(point: Vector) {
        let den = this.direction.dot(this.direction);
        return point.add(this.point, -1).dot(this.direction) / den;
    }

    advance(distance: number) {
        return this.point.add(this.direction, distance);
    }
}
