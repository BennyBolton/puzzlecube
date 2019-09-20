"use strict";


import { CubeConfig, Axis, Face } from "./config";
import { CubeRow } from "./row";
import { CubeFace } from "./face";
import { CubeRing } from "./ring";
import { normalizeInt } from "../util";
import { CubeAction } from "./action";



export class CubeOrientation {
    constructor(
        public readonly config: CubeConfig,
        public readonly right: Face = Face.Right,
        public readonly top: Face = Face.Top,
        public readonly front: Face = Face.Front
    ) {}

    clone() {
        return new CubeOrientation(this.config.clone(),
            this.right, this.top, this.front);
    }

    reorient(right: Face, top: Face, front: Face) {
        return new CubeOrientation(
            this.config,
            this.mapFace(right),
            this.mapFace(top),
            this.mapFace(front)
        );
    }

    rotate(face: Face, angle: number) {
        angle = normalizeInt(angle, 4);
        if (angle == 0) return this;
        if (angle == 2) {
            switch (face & Face.Axis) {
                case Axis.X: return this.reorient(Face.Right, Face.Bottom, Face.Back);
                case Axis.Y: return this.reorient(Face.Left, Face.Top, Face.Back);
                case Axis.Z: return this.reorient(Face.Left, Face.Bottom, Face.Front);
            }
        }
        if (angle == 3) face ^= Face.Positive;
        switch (face) {
            case Face.Left: return this.reorient(Face.Right, Face.Front, Face.Bottom);
            case Face.Right: return this.reorient(Face.Right, Face.Back, Face.Top);
            case Face.Bottom: return this.reorient(Face.Back, Face.Top, Face.Right);
            case Face.Top: return this.reorient(Face.Front, Face.Top, Face.Left);
            case Face.Back: return this.reorient(Face.Top, Face.Left, Face.Front);
            case Face.Front: return this.reorient(Face.Bottom, Face.Right, Face.Front);
        }
        throw new Error("Invalid face");
    }

    isInverse() {
        let expectedTopAxis = ((this.right & Face.Axis) + 2) % 6;
        let axisInOrder = (this.top & Face.Axis) == expectedTopAxis;
        let axisInverted = ((this.right ^ this.top ^ this.front) & Face.Positive) == 0;
        return axisInOrder == axisInverted;
    }

    mapFace(face: Face): Face {
        switch (face) {
            case Face.Left: return this.right ^ Face.Positive;
            case Face.Right: return this.right;
            case Face.Bottom: return this.top ^ Face.Positive;
            case Face.Top: return this.top;
            case Face.Back: return this.front ^ Face.Positive;
            case Face.Front: return this.front;
        }
        throw new Error("Invalid face");
    }

    getRow(along: Face, from: Face, iFace: Face, i: number) {
        return CubeRow.make(
            this.config,
            this.mapFace(along),
            this.mapFace(from),
            this.mapFace(iFace),
            i
        );
    }

    getFace(face: Face, iFrom: Face, jFrom: Face) {
        return CubeFace.make(
            this.config,
            this.mapFace(face),
            this.mapFace(iFrom),
            this.mapFace(jFrom)
        );
    }

    getStandardFace(face: Face) {
        switch (face) {
            case Face.Left: return this.getFace(face, Face.Top, Face.Back);
            case Face.Right: return this.getFace(face, Face.Bottom, Face.Back);
            case Face.Bottom: return this.getFace(face, Face.Front, Face.Left);
            case Face.Top: return this.getFace(face, Face.Back, Face.Left);
            case Face.Back: return this.getFace(face, Face.Right, Face.Bottom);
            case Face.Front: return this.getFace(face, Face.Left, Face.Bottom);
        }
        throw new Error("Invalid face");
    }

    getRing(face: Face, offset: Face, iFrom: Face, jFrom: Face) {
        return CubeRing.make(
            this.config,
            this.mapFace(face),
            offset,
            this.mapFace(iFrom),
            this.mapFace(jFrom)
        );
    }

    getStandardRing(face: Face, offset: number) {
        switch (face) {
            case Face.Left: return this.getRing(face, offset, Face.Top, Face.Back);
            case Face.Right: return this.getRing(face, offset, Face.Bottom, Face.Back);
            case Face.Bottom: return this.getRing(face, offset, Face.Front, Face.Left);
            case Face.Top: return this.getRing(face, offset, Face.Back, Face.Left);
            case Face.Back: return this.getRing(face, offset, Face.Right, Face.Bottom);
            case Face.Front: return this.getRing(face, offset, Face.Left, Face.Bottom);
        }
        throw new Error("Invalid face");
    }

    getAction(face: Face, offset: number, angle: number) {
        if (this.isInverse()) angle = -angle;
        return new CubeAction(this.config, this.mapFace(face), offset, angle);
    }
}
