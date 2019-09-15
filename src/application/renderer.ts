"use strict";


import { Program, Canvas, Shader, Texture, Context, Buffer } from "../gl";
import { Vector } from "../math";

import fragmentSrc from "./shaders/fragment.glsl";
import vertexSrc from "./shaders/vertex.glsl";



export class Renderer extends Program {
    private readonly uProjection = this.uniformMatrix4("uProjection");

    private readonly uCenter = this.uniformFloat3("uCenter");
    private readonly uVectorX = this.uniformFloat3("uVectorX");
    private readonly uVectorY = this.uniformFloat3("uVectorY");

    private readonly uColor = this.uniformFloat4("uColor");
    private readonly uColorTexture = this.uniformInt("uColorTexture");

    private readonly uLightFade = this.uniformFloat("uLightFade");

    private readonly corners: Buffer;

    private constructor(ctx: Context, vertex: Shader, fragment: Shader) {
        super(ctx, vertex, fragment);

        let buffer = new Float32Array([
            0, 0,
            1, 0,
            1, 1,

            0, 0,
            1, 1,
            0, 1
        ]);
        this.corners = new Buffer(ctx, "float", 2);
        this.corners.data(buffer);
    }

    static make(canvas: Canvas) {
        let vertex: Shader | null = null;
        let fragment: Shader | null = null;
        try {
            vertex = canvas.createVertexShader(vertexSrc);
            fragment = canvas.createFragmentShader(fragmentSrc);
            return new Renderer(canvas.ctx, vertex, fragment);
        } finally {
            if (vertex) vertex.finish();
            if (fragment) fragment.finish();
        }
    }

    setProjection(left: number, top: number, near: number, far: number) {
        let matrix = new Float32Array(16);
        matrix[0] = 1 / left;
        matrix[5] = 1 / top;
        matrix[10] = (near + far) / (near - far);
        matrix[14] = (2 * near * far) / (near - far);
        matrix[11] = -1;
        this.uProjection.set(matrix);
    }

    setTexture(texture: Texture) {
        texture.bind();
        this.uColorTexture.set(0);
    }

    setColor(r: number, g: number, b: number, a: number = 1) {
        this.uColor.set(r, g, b, a);
    }

    setLight(fade: number) {
        this.uLightFade.set(fade);
    }

    rect(center: Vector, v1: Vector, v2: Vector) {
        this.uCenter.set(center);
        this.uVectorX.set(v1);
        this.uVectorY.set(v2);
        this.corners.bindAttribute(this);
        this.draw("triangles", 6);
    }
}
