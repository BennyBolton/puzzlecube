"use strict";


import { Context } from "./context";



export class Texture {
    private texture: WebGLTexture | null = null;

    public readonly ready: Promise<Texture>;

    constructor(private readonly ctx: Context, src: string) {
        this.texture = ctx.gl.createTexture();

        this.loadPlaceholder();

        this.ready = new Promise<HTMLImageElement>((resolve, reject) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (ev, file, no, col, err) => {
                reject(err || new Error(`Failed to load texture: ${src}`));
            };
            img.src = src;
        }).then(img => (this.loadImage(img), this));
        
        this.ctx.checkError();
    }

    finish() {
        if (this.texture !== null) {
            this.ctx.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }

    bind() {
        if (this.texture === null) {
            throw new Error("Texture not loaded");
        }

        this.ctx.gl.bindTexture(this.ctx.gl.TEXTURE_2D, this.texture);

        this.ctx.queueErrorCheck();
    }

    private loadPlaceholder() {
        const pixel = new Uint8Array([255, 255, 255, 255]);
        this.ctx.gl.bindTexture(this.ctx.gl.TEXTURE_2D, this.texture);
        this.ctx.gl.texImage2D(this.ctx.gl.TEXTURE_2D, 0, this.ctx.gl.RGBA,
            1, 1, 0, this.ctx.gl.RGBA, this.ctx.gl.UNSIGNED_BYTE, pixel);
    }

    private loadImage(img: HTMLImageElement) {
        if (this.texture == null) return;

        const gl = this.ctx.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        let ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            let max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }

        this.ctx.checkError();
    }
}
