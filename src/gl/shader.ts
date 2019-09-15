"use strict";


import { Context } from "./context";



export class Shader {
    private shader: WebGLShader | null = null;

    constructor(private readonly ctx: Context, src: string, type: number) {
        this.shader = ctx.gl.createShader(type);
        ctx.gl.shaderSource(this.shader, src);
        ctx.gl.compileShader(this.shader);

        if (!ctx.gl.getShaderParameter(this.shader, ctx.gl.COMPILE_STATUS)) {
            let info = ctx.gl.getShaderInfoLog(this.shader);
            ctx.gl.deleteShader(this.shader);
            throw new Error(`Unable to compile shader:\n${info}`);
        }

        ctx.queueErrorCheck();
    }

    finish() {
        if (this.shader !== null) {
            this.ctx.gl.deleteShader(this.shader);
            this.shader = null;
        }
    }

    attachTo(program: WebGLProgram) {
        if (this.shader === null) {
            throw new Error("Shader not loaded");
        }

        this.ctx.gl.attachShader(program, this.shader);

        this.ctx.queueErrorCheck();
    }

    detachFrom(program: WebGLProgram) {
        if (this.shader === null) {
            throw new Error("Shader not loaded");
        }

        this.ctx.gl.detachShader(program, this.shader);
    }
}
