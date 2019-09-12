"use strict";



export class Texture {
    public readonly ready: Promise<undefined>;
    public readonly texture: WebGLTexture;

    constructor(gl: WebGLRenderingContext, src: string) {
        this.texture = gl.createTexture();
        let pixel = new Uint8Array([255, 255, 255, 255]);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        this.ready = new Promise((resolve, reject) => {
            let image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                resolve();
            };
            image.src = src;
        });
    }
}
