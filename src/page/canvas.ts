"use strict";


import * as $ from "jquery";
import { Line, Vector } from "../math";
import { Texture } from "./texture";

import fragmentShaderSrc from "./fragment.glsl";
import vertexShaderSrc from "./vertex.glsl";



enum Attributes {
    iVertex,
    iTexcoords
}



export type MotionCallback =
    (x: number, y: number, dx: number, dy: number) => void;


export type ReleseCallback = (x: number, y: number) => void;



export class ClickHandler {
    private readonly motionCbs = [] as MotionCallback[];
    private readonly releaseCbs = [] as ReleseCallback[];

    constructor(
        public canvas: Canvas,
        public x: number,
        public y: number
    ) {}

    line() {
        return new Line(
            Vector.zero,
            Vector.unit(this.x, this.y, -1 / this.canvas.fov)
        );
    }

    motion(x: number, y: number) {
        let dx = x - this.x;
        let dy = y - this.y;
        this.x = x;
        this.y = y;
        for (let cb of this.motionCbs) {
            cb(x, y, dx, dy);
        }
    }

    release() {
        for (let cb of this.releaseCbs) {
            cb(this.x, this.y);
        }
    }

    onMotion(cb: MotionCallback) {
        this.motionCbs.push(cb);
    }

    onRelease(cb: ReleseCallback) {
        this.releaseCbs.push(cb);
    }
}



export abstract class Canvas {
    public fov = 1; // NOT ANGLE, edge distance at z: -1

    private lastRender: number;
    private gl: WebGLRenderingContext;

    private lastSize = "";
    private program: WebGLProgram;
    private uProjection: WebGLUniformLocation;
    private uColor: WebGLUniformLocation;
    private uTexture: WebGLUniformLocation;
    private vertexBuffer: WebGLBuffer;
    private texcoordBuffer: WebGLBuffer;
    private clickHandler: ClickHandler | null = null;

    constructor(private readonly el: HTMLCanvasElement) {
        let mapCoords = (ev: MouseEvent) => {
            let x = ev.clientX - el.clientWidth / 2;
            let y = el.clientHeight / 2 - ev.clientY;
            let s = el.clientWidth / 2;
            if (el.clientWidth > el.clientHeight) {
                s = el.clientHeight / 2;
            }
            return { x: x / s, y: y / s };
        }

        el.onmousedown = ev => {
            if (this.clickHandler) {
                this.clickHandler.release();
            }
            
            let { x, y } = mapCoords(ev);
            this.clickHandler = new ClickHandler(this, x, y);
            this.click(this.clickHandler);
        }

        el.onmousemove = ev => {
            if (this.clickHandler) {;
                let { x, y } = mapCoords(ev);
                this.clickHandler.motion(x, y);
            }
        }

        el.onmouseup = ev => {
            if (this.clickHandler) {
                this.clickHandler.release();
                this.clickHandler = null;
            }
        }

        this.lastRender = Date.now();
        let gl = this.gl = el.getContext("webgl");
        if (!this.gl) {
            throw new Error("Unable to create webgl context");
        }

        gl.enable(gl.DEPTH_TEST);

        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSrc);
        gl.compileShader(vertexShader);

        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSrc);
        gl.compileShader(fragmentShader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        // TODO cleanup shaders now and program on end

        gl.useProgram(this.program);
        this.uProjection = gl.getUniformLocation(this.program, "uProjection");
        this.uColor = gl.getUniformLocation(this.program, "uColor");
        this.uTexture = gl.getUniformLocation(this.program, "uTexture");

        this.vertexBuffer = gl.createBuffer();

        this.texcoordBuffer = gl.createBuffer();
        let arr = new Float32Array([
            0, 0,
            1, 0,
            1, 1,

            0, 0,
            1, 1,
            0, 1
        ]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, arr, this.gl.STATIC_DRAW);

        setInterval(() => this._render(), 15);
    }

    private projection(width: number, height: number, near = 0.1, far = 100) {
        let matrix = new Float32Array(16);
        let ifov = 1 / this.fov;
        matrix[0] = width > height ? ifov * height / width : ifov;
        matrix[5] = height > width ? ifov * width / height : ifov;
        matrix[10] = (near + far) / (near - far);
        matrix[14] = (2 * near * far) / (near - far);
        matrix[11] = -1;
        return matrix;
    }

    clear(r: number, g: number, b: number, a: number = 1) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setColor(r: number, g: number, b: number, a: number = 1) {
        this.gl.uniform4f(this.uColor, r, g, b, a);
    }

    loadTexture(src: string) {
        return new Texture(this.gl, src);
    }

    setTexture(tex: Texture) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex.texture);
        this.gl.uniform1i(this.uTexture, 0);
    }

    rect(p1: Vector, p2: Vector, p3: Vector, p4: Vector) {
        this.gl.useProgram(this.program);

        let arr = new Float32Array([
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.z,
            p3.x, p3.y, p3.z,

            p1.x, p1.y, p1.z,
            p3.x, p3.y, p3.z,
            p4.x, p4.y, p4.z
        ]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, arr, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(Attributes.iVertex);
        this.gl.vertexAttribPointer(Attributes.iVertex, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.enableVertexAttribArray(Attributes.iTexcoords);
        this.gl.vertexAttribPointer(Attributes.iTexcoords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    click(ev: ClickHandler) {};

    abstract render(dt: number): void;

    private _render() {
        this.el.width = this.el.clientWidth;
        this.el.height = this.el.clientHeight;
        let size = `${this.el.width}x${this.el.height}`;

        if (this.lastSize != size) {
            this.lastSize = size;
            console.log(size);
            this.gl.viewport(0, 0, this.el.width, this.el.height);
            let proj = this.projection(this.el.width, this.el.height);
            this.gl.uniformMatrix4fv(this.uProjection, false, proj);
        }

        let time = Date.now();
        let dt = time - this.lastRender;
        this.lastRender = time;

        this.render(dt);
    }
}
