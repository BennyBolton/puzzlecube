"use strict";


import { Page, Canvas, ClickHandler, Texture } from "./page";
import { Vector, Plane, Line } from "./math";
import { Cube, CubeAction, CubeSlice } from "./cube";



class ExCanvas extends Canvas {
    public angle = 0;
    public pieceTex: Texture = this.loadTexture("piece.png");

    constructor(el: HTMLCanvasElement, public cube: Cube) {
        super(el);
    }

    click(handler: ClickHandler) {
        let line = handler.line();
        let faces = this.cube.getFaces().map(({ plane, iv, jv }, face) => {
            let distance = plane.intersect(line);
            let p = line.advance(distance);
            let i = new Line(plane.point, iv).closestPoint(p);
            let j = new Line(plane.point, jv).closestPoint(p);
            return { p, plane, iv, jv, i, j, distance, face };
        });
        
        let face = faces
            .filter(x => Math.abs(x.i) < 1 && Math.abs(x.j) < 1)
            .reduce((a, b) => a && a.distance < b.distance ? a : b, null);

        if (face) {
            this.cube.setActor(null);
            let oldX = handler.x, oldY = handler.y;
            handler.onRelease((x, y) => {
                let dx = x - oldX, dy = y - oldY;
                if (dx * dx + dy * dy > 1e-6) {
                    let line = handler.line();
                    let v = line.advance(face.plane.intersect(line)).add(face.p, -1);
                    let ia = v.dot(face.iv);
                    let ja = v.dot(face.jv);
                    if (Math.abs(ia) > Math.abs(ja)) {
                        // Take i
                        let slice = new CubeSlice(
                            this.cube.dim,
                            face.face < 4 ? 2 : 1,
                            Math.floor((face.j / 2 + 0.5) * this.cube.dim)
                        );
                        // x: 1, y: -1, x: 1
                        let angle = face.face == 2 || face.face == 3 ? -1 : 1;
                        if (face.face % 2) angle = -angle;
                        if (ia < 0) angle = -angle;
                        this.cube.adjust(new CubeAction(slice, angle));
                    } else {
                        // Take j
                        let slice = new CubeSlice(
                            this.cube.dim,
                            face.face > 1 ? 0 : 1,
                            Math.floor((face.i / 2 + 0.5) * this.cube.dim)
                        );
                        // x: -1, y: 1, -1
                        let angle = face.face == 2 || face.face == 3 ? 1 : -1;
                        if (face.face % 2 == 1) angle = -angle;
                        if (ja < 0) angle = -angle;
                        this.cube.adjust(new CubeAction(slice, angle));
                    }
                }
            });
        } else {
            handler.onMotion((x, y, dx, dy) => {
                if (dx == 0 && dy == 0) return;
                let axis = Vector.unit(-dy, dx, 0);
                let angle = 3 * Math.hypot(dx, dy);
                this.cube.rotate(axis, angle);
            });
        }
    }

    render(dt: number) {
       this.clear(0, 0.1, 0.2);
       this.cube.render(this, dt, this.pieceTex);
    }
}


function *shuffle(cube: Cube) {
    while (true) {
        yield new CubeAction(
            cube.config.slice(
                Math.floor(Math.random() * 3),
                Math.floor(Math.random() * cube.config.dim)
            ),
            Math.random() > 0.5 ? 1 : -1
        );
    }
}


let page = new Page();
page.ready.then(() => {
    let el = page.get<HTMLCanvasElement>("render");
    let cube = new Cube(+page.setting("size"));
    let canvas = new ExCanvas(el, cube);

    canvas.fov = 0.7;
    cube.center = new Vector(0, 0, -4);

    page.get("shuffle").onclick = () => {
        cube.setActor(shuffle(cube));
    }

    page.get("undo").onclick = () => {
        cube.undo();
    }

    page.get("redo").onclick = () => {
        cube.redo();
    }

    page.onSettingsChange(() => {
        let dim = +page.setting("size");
        if (dim != cube.dim) cube = canvas.cube = new Cube(dim);
    });
});
