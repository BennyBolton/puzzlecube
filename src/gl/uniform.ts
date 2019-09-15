"use strict";


import { Context } from "./context";
import { Vector } from "../math";



export interface UniformConstructor<T> {
    new(ctx: Context, bind: () => void, location: WebGLUniformLocation): T
}



export abstract class Uniform {
    constructor(
        protected readonly ctx: Context,
        public readonly bindProgram: () => void,
        public readonly location: WebGLUniformLocation
    ) {}
}



export class UniformFloat extends Uniform {
    set(x: number) {
        this.bindProgram();
        this.ctx.gl.uniform1f(this.location, x);
        this.ctx.queueErrorCheck();
    }
}



export class UniformFloat2 extends Uniform {
    set(x1: number, x2: number) {
        this.bindProgram();
        this.ctx.gl.uniform2f(this.location, x1, x2);
        this.ctx.queueErrorCheck();
    }
}



export class UniformFloat3 extends Uniform {
    set(x1: number, x2: number, x3: number): void;
    set(v: Vector): void;
    set(x1: number | Vector, x2?: number, x3?: number) {
        this.bindProgram();
        if (x1 instanceof Vector) {
            this.ctx.gl.uniform3f(this.location, x1.x, x1.y, x1.z);
        } else {
            this.ctx.gl.uniform3f(this.location, x1, x2, x3);
        }
        this.ctx.queueErrorCheck();
    }
}



export class UniformFloat4 extends Uniform {
    set(x1: number, x2: number, x3: number, x4: number) {
        this.bindProgram();
        this.ctx.gl.uniform4f(this.location, x1, x2, x3, x4);
        this.ctx.queueErrorCheck();
    }
}



export class UniformInt extends Uniform {
    set(x: number) {
        this.bindProgram();
        this.ctx.gl.uniform1i(this.location, x);
        this.ctx.queueErrorCheck();
    }
}



export class UniformInt2 extends Uniform {
    set(x1: number, x2: number) {
        this.bindProgram();
        this.ctx.gl.uniform2i(this.location, x1, x2);
        this.ctx.queueErrorCheck();
    }
}



export class UniformInt3 extends Uniform {
    set(x1: number, x2: number, x3: number) {
        this.bindProgram();
        this.ctx.gl.uniform3i(this.location, x1, x2, x3);
        this.ctx.queueErrorCheck();
    }
}



export class UniformInt4 extends Uniform {
    set(x1: number, x2: number, x3: number, x4: number) {
        this.bindProgram();
        this.ctx.gl.uniform4i(this.location, x1, x2, x3, x4);
        this.ctx.queueErrorCheck();
    }
}



export class UniformMatrix2 extends Uniform {
    set(mat: Float32List) {
        if (mat.length != 4) throw new Error("Invalid length for matrix");
        this.bindProgram();
        this.ctx.gl.uniformMatrix2fv(this.location, false, mat);
        this.ctx.queueErrorCheck();
    }
}



export class UniformMatrix3 extends Uniform {
    set(mat: Float32List) {
        if (mat.length != 9) throw new Error("Invalid length for matrix");
        this.bindProgram();
        this.ctx.gl.uniformMatrix3fv(this.location, false, mat);
        this.ctx.queueErrorCheck();
    }
}



export class UniformMatrix4 extends Uniform {
    set(mat: Float32List) {
        if (mat.length != 16) throw new Error("Invalid length for matrix");
        this.bindProgram();
        this.ctx.gl.uniformMatrix4fv(this.location, false, mat);
        this.ctx.queueErrorCheck();
    }
}
