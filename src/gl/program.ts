"use strict";


import { Context, DrawMode } from "./context";
import { Shader } from "./shader";
import {
    Uniform, UniformConstructor,
    UniformFloat, UniformFloat2, UniformFloat3, UniformFloat4,
    UniformInt, UniformInt2, UniformInt3, UniformInt4,
    UniformMatrix2, UniformMatrix3, UniformMatrix4
} from "./uniform";



export class Program {
    private static lastBind = new WeakMap<Context, Program>();

    private program: WebGLProgram | null = null;

    constructor(private readonly ctx: Context, ...shaders: Shader[]) {
        this.bind = this.bind.bind(this);

        this.program = ctx.gl.createProgram();

        for (let shader of shaders) {
            shader.attachTo(this.program);
        }
        ctx.gl.linkProgram(this.program);
        for (let shader of shaders) {
            shader.detachFrom(this.program);
        }

        if (!ctx.gl.getProgramParameter(this.program, ctx.gl.LINK_STATUS)) {
            let info = ctx.gl.getProgramInfoLog(this.program);
            ctx.gl.deleteProgram(this.program);
            throw new Error(`Failed to link program:\n${info}`);
        }

        ctx.checkError();
    }

    finish() {
        if (this.program !== null) {
            this.ctx.gl.deleteProgram(this.program);
            this.program = null;
        }
    }

    bind() {
        if (this.program === null) {
            throw new Error("Program not loaded");
        }

        if (Program.lastBind.get(this.ctx) === this) return;
        Program.lastBind.delete(this.ctx);
        this.ctx.gl.useProgram(this.program);
        Program.lastBind.set(this.ctx, this);

        this.ctx.queueErrorCheck();
    }

    draw(mode: DrawMode, count: number): void;
    draw(mode: DrawMode, first: number, count: number): void;
    draw(mode: DrawMode, first: number, count?: number) {
        if (count === undefined) {
            count = first;
            first = 0;
        }

        this.bind();
        this.ctx.gl.drawArrays(this.ctx.drawMode(mode), first, count);

        this.ctx.queueErrorCheck();
    }

    uniformLocation(name: string) {
        if (this.program === null) {
            throw new Error("Program not loaded");
        }

        this.bind();
        let location = this.ctx.gl.getUniformLocation(this.program, name);
        if (location === null) {
            throw new Error(`Unable to find uniform ${name}`);
        }

        this.ctx.queueErrorCheck();
        return location;
    }

    private uniform<T>(cons: UniformConstructor<T>, name: string) {
        let location = this.uniformLocation(name);
        return new cons(this.ctx, this.bind, location);
    }

    uniformFloat(name: string) { return this.uniform(UniformFloat, name); }
    uniformFloat2(name: string) { return this.uniform(UniformFloat2, name); }
    uniformFloat3(name: string) { return this.uniform(UniformFloat3, name); }
    uniformFloat4(name: string) { return this.uniform(UniformFloat4, name); }

    uniformInt(name: string) { return this.uniform(UniformInt, name); }
    uniformInt2(name: string) { return this.uniform(UniformInt2, name); }
    uniformInt3(name: string) { return this.uniform(UniformInt3, name); }
    uniformInt4(name: string) { return this.uniform(UniformInt4, name); }

    uniformMatrix2(name: string) { return this.uniform(UniformMatrix2, name); }
    uniformMatrix3(name: string) { return this.uniform(UniformMatrix3, name); }
    uniformMatrix4(name: string) { return this.uniform(UniformMatrix4, name); }
}
