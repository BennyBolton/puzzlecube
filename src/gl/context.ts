"use strict";


import { Throttle } from "../util";



export type DataType
    = "float" | "int8" | "int16" | "int32"
    | "uint8" | "uint16" | "uint32";


export type DrawMode
    = "triangles" | "triangleStrip" | "lines" | "lineStrip" | "points";



export class Context {
    private readonly errorThrottle = new Throttle();

    constructor(public readonly gl: WebGLRenderingContext) {}

    clearError() {
        this.gl.getError();
    }

    queueErrorCheck() {
        this.errorThrottle.call(() => this.checkError());
    }

    checkError() {
        this.errorThrottle.cancel();

        let err = this.gl.getError();
        if (err == this.gl.NO_ERROR) return;

        switch (err) {
            case this.gl.INVALID_ENUM:
                throw new Error("INVALID_ENUM");
                
            case this.gl.INVALID_VALUE:
                throw new Error("INVALID_VALUE");
                
            case this.gl.INVALID_OPERATION:
                throw new Error("INVALID_OPERATION");
                
            case this.gl.INVALID_FRAMEBUFFER_OPERATION:
                throw new Error("INVALID_FRAMEBUFFER_OPERATION");
                
            case this.gl.OUT_OF_MEMORY:
                throw new Error("OUT_OF_MEMORY");
                
            default:
                throw new Error(`Unknown error code ${err}`);
        }
    }

    dataType(type: DataType) {
        switch (type) {
            case "float": return this.gl.FLOAT;
            case "int8": return this.gl.BYTE;
            case "int16": return this.gl.SHORT;
            case "int32": return this.gl.INT;
            case "uint8": return this.gl.UNSIGNED_BYTE;
            case "uint16": return this.gl.UNSIGNED_SHORT;
            case "uint32": return this.gl.UNSIGNED_INT;
            default: throw new Error(`Invalid type: ${type}`);
        }
    }

    dataTypeSize(type: DataType) {
        switch (type) {
            case "float":
            case "int32":
            case "uint32":
                return 4;

            case "int16":
            case "uint16":
                return 2;

            case "int8":
            case "uint8":
                return 1;

            default:
                throw new Error(`Invalid type: ${type}`);
        }
    }

    drawMode(mode: DrawMode) {
        switch (mode) {
            case "triangles": return this.gl.TRIANGLES;
            case "triangleStrip": return this.gl.TRIANGLE_STRIP;
            case "lines": return this.gl.LINES;
            case "lineStrip": return this.gl.LINE_STRIP;
            case "points": return this.gl.POINTS;
        }
    }
}
