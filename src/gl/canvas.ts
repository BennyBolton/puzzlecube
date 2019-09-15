"use strict";


import { Context, DataType } from "./context";
import { Texture } from "./texture";
import { Shader } from "./shader";
import { Buffer } from "./buffer";
import { Line, Vector } from "../math";
import { Event } from "../util";



export class ScreenPosition {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) {}

    getLine(fov: number) {
        return new Line(
            Vector.zero,
            Vector.unit(this.x, this.y, -1 / fov)
        );
    }
}



export class ScreenMotion extends ScreenPosition {
    constructor(
        x: number, y: number,
        public readonly dx: number,
        public readonly dy: number
    ) {
        super(x, y);
    }
}



export class ClickHandler {
    public readonly onMotion = new Event<ScreenMotion>();
    public readonly onRelease = new Event<ScreenPosition>();

    constructor(
        public readonly button: number,
        public readonly pos: ScreenPosition
    ) {}
}



export class Canvas {
    public readonly ctx: Context;

    private readonly clickHandlers = [] as ClickHandler[];
    private lastFrame = Date.now() / 1000;
    private lastPosition = new ScreenPosition(0, 0);
    private exposed = false;
    public exposeOnResize = false;

    constructor(private readonly el: HTMLCanvasElement) {
        this.ctx = new Context(el.getContext("webgl"));
        this.ctx.gl.enable(this.ctx.gl.DEPTH_TEST);
        this.ctx.gl.enable(this.ctx.gl.CULL_FACE);

        this.ctx.checkError();

        el.onmousedown = ev => {
            let handler = new ClickHandler(ev.button, this.mousePosition(ev));
            this.clickHandlers.push(handler);
            this.click(handler);
        };

        el.onmousemove = ev => {
            let motion = this.mousePosition(ev, this.lastPosition);
            for (let handler of this.clickHandlers) {
                handler.onMotion.emit(motion);
            }
            this.lastPosition = motion;
        };

        el.onmouseup = ev => {
            let position = this.mousePosition(ev);
            let end = this.clickHandlers.length;
            for (let i = 0; i < end;) {
                if (this.clickHandlers[i].button == ev.button) {
                    this.clickHandlers[i].onRelease.emit(position);
                    this.clickHandlers[i] = this.clickHandlers[--end];
                } else {
                    ++i;
                }
            }
            this.clickHandlers.length = end;
        };

        el.oncontextmenu = ev => ev.preventDefault();

        window.requestAnimationFrame(() => this._render());
    }

    private mousePosition(ev: MouseEvent): ScreenPosition;
    private mousePosition(ev: MouseEvent, from?: ScreenPosition): ScreenMotion;
    private mousePosition(ev: MouseEvent, from?: ScreenPosition) {
        let x = ev.clientX - this.el.offsetLeft;
        let y = ev.clientY - this.el.offsetTop;
        let s = this.el.clientWidth / 2;
        if (this.el.clientWidth > this.el.clientHeight) {
            s = this.el.clientHeight / 2;
        }
        x = (x - this.el.clientWidth / 2) / s;
        y = (this.el.clientHeight / 2 - y) / s;
        if (from) {
            return new ScreenMotion(x, y, x - from.x, y - from.y);
        } else {
            return new ScreenPosition(x, y);
        }
    }

    createBuffer(type: DataType, widths: number[]) {
        return new Buffer(this.ctx, type, ...widths);
    }

    createVertexShader(src: string) {
        return new Shader(this.ctx, src, this.ctx.gl.VERTEX_SHADER);
    }

    createFragmentShader(src: string) {
        return new Shader(this.ctx, src, this.ctx.gl.FRAGMENT_SHADER);
    }

    createTexture(src: string) {
        return new Texture(this.ctx, src);
    }

    get width() {
        return this.el.width;
    }

    get height() {
        return this.el.height;
    }

    clear(r: number, g: number, b: number, a: number = 1) {
        let gl = this.ctx.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    expose(clearTime = false) {
        this.exposed = true;
        if (clearTime) {
            this.lastFrame = Date.now() / 1000;
        }
    }

    private _render() {
        window.requestAnimationFrame(() => this._render());

        let width = this.el.clientWidth * window.devicePixelRatio;
        let height = this.el.clientHeight * window.devicePixelRatio;

        if (!this.exposed && this.exposeOnResize) {
            if (width != this.el.width || height != this.el.height) {
                this.exposed = true;
            }
        }

        if (!this.exposed) return;

        this.exposed = false;

        this.el.width = width;
        this.el.height = height;
        this.ctx.gl.viewport(0, 0, this.el.width, this.el.height);

        let time = Date.now() / 1000;
        this.render(time - this.lastFrame);
        this.lastFrame = time;

        this.ctx.checkError();
    }

    click(click: ClickHandler) {}
    render(dt: number) {}
}
