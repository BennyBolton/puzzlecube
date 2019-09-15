"use strict";


import { Context, DataType } from "./context";
import { Program } from "./program";



export class Buffer {
    private buffer: WebGLBuffer | null = null;
    private readonly type: number;
    private readonly width: number;
    private readonly segments = [] as { width: number, offset: number }[];


    constructor(
        private readonly ctx: Context,
        type: DataType,
        ...widths: number[]
    ) {
        if (widths.length == 0) {
            throw new Error("Expected at least one width");
        }

        let totalWidth = 0;
        let size = ctx.dataTypeSize(type);
        this.segments = widths.map(width => {
            let offset = totalWidth;
            totalWidth += width * size;
            return { width, offset };
        });
        this.width = totalWidth;
        this.type = ctx.dataType(type);

        this.buffer = ctx.gl.createBuffer();

        ctx.queueErrorCheck();
    }

    finish() {
        if (this.buffer !== null) {
            this.ctx.gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }
    }

    data(data: BufferSource, fixed = true) {
        if (this.buffer === null) {
            throw new Error("Buffer not loaded");
        }

        let usage = fixed ? this.ctx.gl.STATIC_DRAW : this.ctx.gl.DYNAMIC_DRAW;
        this.ctx.gl.bindBuffer(this.ctx.gl.ARRAY_BUFFER, this.buffer);
        this.ctx.gl.bufferData(this.ctx.gl.ARRAY_BUFFER, data, usage);

        this.ctx.queueErrorCheck();
    }

    bindAttribute(program: Program, index = 0, segment = 0) {
        if (this.buffer === null) {
            throw new Error("Buffer not loaded");
        }

        if (segment < 0 || segment >= this.segments.length) {
            throw new Error(`Invalid segment: ${segment}`);
        }

        program.bind();

        this.ctx.gl.bindBuffer(this.ctx.gl.ARRAY_BUFFER, this.buffer);
        this.ctx.gl.enableVertexAttribArray(index);
        let { width, offset } = this.segments[segment];
        this.ctx.gl.vertexAttribPointer(
            index, width, this.type, false, this.width, offset);

        this.ctx.queueErrorCheck();
    }
}
