"use strict";


import { CubeConfig, CubeAction, CubeFace, Axis, Face } from "../model";
import { Renderer } from "./renderer";
import { Vector, Line, Plane, UnitSpace } from "../math";



interface FacePosition {
    readonly face: number;
    readonly i: number;
    readonly j: number;
}



export class CubeView extends CubeConfig {
    private static readonly faceDimensions = [
        { v: Vector.X.neg(), iv: Vector.Y.neg(), jv: Vector.Z },
        { v: Vector.X,       iv: Vector.Y,       jv: Vector.Z },
        { v: Vector.Y.neg(), iv: Vector.Z.neg(), jv: Vector.X },
        { v: Vector.Y,       iv: Vector.Z,       jv: Vector.X },
        { v: Vector.Z.neg(), iv: Vector.X.neg(), jv: Vector.Y },
        { v: Vector.Z,       iv: Vector.X,       jv: Vector.Y },
    ];

    private center = Vector.zero;
    private space = UnitSpace.Base;

    private animation: CubeAction | null = null;
    private animationProgress = 0;
    private animationCb: (() => void) | null = null;

    constructor(
        private readonly renderer: Renderer,
        public readonly size: number
    ) {
        super(size);

        let points = new Float32Array(
            (this.size * this.size * 6 + (this.size - 1) * 12) * 42);

        for (let face = 0; face < 6; ++face) {
            let faceAxis = (face & Face.Axis) / 2;
            let iAxis = (faceAxis + 1) % 3;
            let jAxis = (faceAxis + 2) % 3;

            for (let i = 0; i < size; ++i) {
                for (let j = 0; j < size; ++j) {
                    let rect = points.subarray(
                        ((face * size + j) * size + i) * 42);

                    rect[6] = face;
                    if (face & Face.Positive) {
                        rect[faceAxis] = size - 1;
                        rect[faceAxis + 3] = 1;
                    }
                    rect[iAxis] = (face & Face.Positive) ? i : size - i - 1;
                    rect[jAxis] = j;

                    rect.copyWithin(7, 0, 7);
                    rect.copyWithin(14, 0, 7);
                    rect.copyWithin(21, 0, 7);

                    rect[((face & Face.Positive) ? 10 : 3) + iAxis] = 1;
                    rect[((face & Face.Positive) ? 17 : 24) + iAxis] = 1;
                    rect[17 + jAxis] = 1;
                    rect[24 + jAxis] = 1;

                    rect.copyWithin(28, 0, 7);
                    rect.copyWithin(35, 14, 21);
                }
            }
        }

        let offset = this.size * this.size * 252;
        for (let face = 0; face < 6; ++face) {
            let faceAxis = (face & Face.Axis) / 2;
            let iAxis = (faceAxis + 1) % 3;
            let jAxis = (faceAxis + 2) % 3;

            for (let i = 1; i < this.size; ++i) {
                let rect = points.subarray(
                    offset + ((this.size - 1) * face + i - 1) * 42);

                rect[6] = face;
                if (face & Face.Positive) {
                    rect[faceAxis] = size - i - 1;
                    rect[faceAxis + 3] = 1;
                } else {
                    rect[faceAxis] = i;
                }

                rect[iAxis] = size;
                rect[jAxis] = size;

                rect.copyWithin(7, 0, 7);
                rect.copyWithin(14, 0, 7);
                rect.copyWithin(21, 0, 7);

                rect[((face & Face.Positive) ? iAxis : jAxis) + 10] = -size;
                rect[((face & Face.Positive) ? jAxis : iAxis) + 24] = -size;
                rect[17 + iAxis] = -size;
                rect[17 + jAxis] = -size;

                rect.copyWithin(28, 0, 7);
                rect.copyWithin(35, 14, 21);
            }
        }
        renderer.setPoints(this.size, points);
        this.updateColors();
    }

    private updateColors() {
        this.renderer.setColors(this.data);
    }

    action(action: CubeAction, cb?: () => void) {
        action.act();
        this.updateColors();
        this.animation = action;
        this.animationProgress = 0;
        this.animationCb = cb;
        this.renderer.setAnimation(action);
    }

    isAnimating() {
        return this.animation !== null;
    }

    move(center: Vector) {
        this.center = center;
    }

    rotate(axis: Vector, angle: number) {
        this.space = this.space.rotate(axis, angle);
    }

    intersectFace(face: number, line: Line) {
        let { v, iv, jv } = CubeView.faceDimensions[face];

        v = this.space.map(v);
        iv = this.space.map(iv);
        jv = this.space.map(jv);

        let plane = new Plane(this.center.add(v), v);
        let distance = plane.distanceTo(line);
        let p = line.advance(distance);
        let i = new Line(plane.point, iv).distanceTo(p) / 2 + 0.5;
        let j = new Line(plane.point, jv).distanceTo(p) / 2 + 0.5;

        return { i, j, distance };
    }

    intersect(line: Line) {
        let bestFace: null | FacePosition = null, closest = Infinity;
        for (let face = 0; face < 6; ++face) {
            let { i, j, distance } = this.intersectFace(face, line);

            if (i >= 0 && i <= 1 && j >= 0 && j <= 1 && distance < closest) {
                closest = distance;
                bestFace = { face, i, j };
            }
        };
        return bestFace;
    }

    render(dt: number) {
        let rotationAxis = Vector.X, rotationAngle = 0;
        if (this.animation) {
            this.animationProgress += dt;
            if (this.animationProgress > 1) {
                let cb = this.animationCb;
                this.animationProgress = 1;
                this.animation = null;
                this.animationCb = null;
                if (cb) cb();
            }
        }

        if (this.animation) {
            switch (this.animation.face) {
                case Face.Left: rotationAxis = this.space.x.neg(); break;
                case Face.Right: rotationAxis = this.space.x; break;
                case Face.Bottom: rotationAxis = this.space.y.neg(); break;
                case Face.Top: rotationAxis = this.space.y; break;
                case Face.Back: rotationAxis = this.space.z.neg(); break;
                case Face.Front: rotationAxis = this.space.z; break;
            }
            let progress = Math.cos(this.animationProgress * Math.PI) + 1;
            rotationAngle = -this.animation.angle * Math.PI * progress / 4;
        }

        let animatedSpace = this.space.rotate(rotationAxis, rotationAngle);
        this.renderer.render(this.center, this.space, animatedSpace);
    }
}
