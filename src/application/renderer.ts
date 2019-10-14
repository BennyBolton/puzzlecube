"use strict";


import { CubeAction, Face, Axis } from "../model";
import { Program, Canvas, Shader, Texture, Context, Buffer } from "../gl";
import { Vector, UnitSpace } from "../math";

import fragmentSrc from "./resources/fragment.glsl";
import vertexSrc from "./resources/vertex.glsl";



export class Rect {
    constructor(
        public readonly face: number,
        public readonly point: Vector,
        public readonly offset: Vector,
        public readonly di: Vector,
        public readonly dj: Vector,
    ) {}
}



export class Renderer extends Program {
    private readonly uSize = this.uniformFloat("uSize");
    private readonly uProjection = this.uniformMatrix4("uProjection");

    private readonly uCenter = this.uniformFloat3("uCenter");
    private readonly uTransform = this.uniformMatrix3("uTransform");

    private readonly uAnimate = this.uniformFloat3("uAnimate");
    private readonly uAnimateTransform = this.uniformMatrix3("uAnimateTransform");

    private readonly uLightFade = this.uniformFloat("uLightFade");

    private readonly uColorTexture = this.uniformInt("uColorTexture");

    private readonly points: Buffer;
    private readonly colors: Buffer;
    private count = 0;

    private constructor(ctx: Context, vertex: Shader, fragment: Shader) {
        super(ctx, vertex, fragment);

        this.points = new Buffer(ctx, "float", 3, 3, 1);
        this.colors = new Buffer(ctx, "float", 1);
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

    setLight(fade: number) {
        this.uLightFade.set(fade);
    }

    setPoints(size: number, rects: Iterable<Rect>) {
        this.uSize.set(size);
        let buffer = new Float32Array(size * size * 252 + (size - 1) * 252);
        let i = 0;
        for (let { face, point, offset, di, dj } of rects) {
            let p1 = [
                point.x, point.y, point.z,
                offset.x, offset.y, offset.z,
                face
            ];
            let p2 = [
                point.x, point.y, point.z,
                offset.x + di.x, offset.y + di.y, offset.z + di.z,
                face
            ];
            let p3 = [
                point.x, point.y, point.z,
                offset.x + di.x + dj.x,
                offset.y + di.y + dj.y,
                offset.z + di.z + dj.z,
                face
            ];
            let p4 = [
                point.x, point.y, point.z,
                offset.x + dj.x, offset.y + dj.y, offset.z + dj.z,
                face
            ];
            buffer.set(p1, i);
            buffer.set(p2, i + 7);
            buffer.set(p3, i + 14);
            buffer.set(p1, i + 21);
            buffer.set(p3, i + 28);
            buffer.set(p4, i + 35);
            i += 42;
        }
        this.points.data(buffer, true);
        this.count = buffer.length / 7;
    }

    setColors(colors: ArrayLike<number>) {
        let buf = new Float32Array(this.count);
        let end = Math.min(colors.length * 6, this.count);
        for (let i = 0; i < end; ++i) {
            buf[i] = colors[Math.floor(i / 6)] + 1;
        }
        this.colors.data(buf, false);
    }

    setAnimation(action: CubeAction) {
        let index = action.offset;
        if (action.face & Face.Positive) {
            index = action.config.size - action.offset - 1;
        }
        this.uAnimate.set(
            (action.face & Face.Axis) == Axis.X ? index : -1,
            (action.face & Face.Axis) == Axis.Y ? index : -1,
            (action.face & Face.Axis) == Axis.Z ? index : -1
        );
    }

    render(center: Vector, space: UnitSpace, animate: UnitSpace) {
        this.uCenter.set(center);
        this.uTransform.set(space);
        this.uAnimateTransform.set(animate);

        this.points.bindAttribute(this, 0, 0);
        this.points.bindAttribute(this, 1, 1);
        this.points.bindAttribute(this, 2, 2);
        this.colors.bindAttribute(this, 3, 0);
        this.draw("triangles", this.count);
    }
}
