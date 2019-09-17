"use strict";


import { CubeConfig, CubeAction, Face, Axis } from "../model";
import { Renderer, Rect } from "./renderer";
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

        renderer.setPoints(this.size, (function *() {
            for (let face = 0; face < 6; ++face) {
                let { v, iv, jv } = CubeView.faceDimensions[face];

                let corner = Vector.zero;
                let offset = Vector.zero;
                if (face & Face.Positive) {
                    corner = v.scale(size - 1);
                    offset = v;
                } else {
                    corner = iv.scale(1 - size);
                    offset = iv.neg();
                }

                for (let j = 0; j < size; ++j) {
                    for (let i = 0; i < size; ++i) {
                        yield new Rect(
                            face,
                            corner.add(iv, i).add(jv, j),
                            offset,
                            iv, jv
                        );
                    }
                }
            }

            for (let face = 0; face < 6; ++face) {
                let { v, iv, jv } = CubeView.faceDimensions[face];

                let vStart = new Vector(size, size, size);
                let vOffset = Vector.zero;
                if (face & Face.Positive) {
                    vOffset = v;
                    v = v.neg();
                }
                iv = iv.scale((face & Face.Positive) ? -size : size);
                jv = jv.scale(-size);

                for (let i = 1; i < size; ++i) {
                    yield new Rect(
                        face,
                        vStart.add(v, i).add(vOffset, -1),
                        vOffset,
                        (face & Face.Positive) ? iv : jv,
                        (face & Face.Positive) ? jv : iv
                    );
                }
            }
        })());
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

        let rotationAxis = Vector.X;
        let rotationAngle = 0;

        if (this.animation) {
            rotationAxis = this.space.map(
                CubeView.faceDimensions[this.animation.face].v);
            let progress = Math.cos(this.animationProgress * Math.PI) + 1;
            rotationAngle = -this.animation.angle * Math.PI * progress / 4;
        }

        let animatedSpace = this.space.rotate(rotationAxis, rotationAngle);
        this.renderer.render(this.center, this.space, animatedSpace);
    }
}
