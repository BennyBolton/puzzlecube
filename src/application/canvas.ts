"use strict";


import { Settings } from "./settings";
import { shuffleCube } from "./shuffle";
import { Renderer } from "./renderer";
import { CubeView } from "./view";
import { Canvas, Texture, ClickHandler } from "../gl";
import { CubeAction, CubeSlice, CubeConfig } from "../cube";
import { Vector } from "../math";
import { Hook } from "../util";



export class CubeCanvas extends Canvas {
    private readonly renderer = Renderer.make(this);
    private readonly pieceTexture = this.createTexture("piece.png");
    private readonly undoList = [] as CubeAction[];
    private readonly redoList = [] as CubeAction[];
    private cube: CubeView;
    private actor: Iterator<CubeAction> | null = null;

    public readonly onNewCube = new Hook<[CubeConfig]>();
    public readonly onAction =
        new Hook<[CubeAction, Iterator<CubeAction> | undefined]>();

    constructor(private readonly settings: Settings, el: HTMLCanvasElement) {
        super(el);

        this.exposeOnResize = true;

        this.pieceTexture.ready.then(() => this.expose());

        this.settings.onChange.bind(() => this.configure());
        this.configure();
    }

    getConfig() {
        return this.cube.config;
    }

    configure() {
        let size = +this.settings.get("size");
        if (!this.cube || this.cube.size != size) {
            this.cube = new CubeView(size);
            this.undoList.length = 0;
            this.redoList.length = 0;
            this.onNewCube.emit(this.cube.config);
        }
        this.expose();
    }

    action(action: CubeAction, actor?: Iterator<CubeAction>) {
        this.actor = actor;
        this.takeAction(action, actor);
        this.undoList.push(action);
        this.redoList.length = 0;
    }

    private takeAction(action: CubeAction, actor?: Iterator<CubeAction>) {
        this.cube.action(action, actor ? () => this.nextMove() : undefined);
        this.expose(true);
        this.onAction.emit(action, actor);
    }

    undo() {
        if (this.undoList.length == 0) return;

        let action = this.undoList.pop().invert();
        this.takeAction(action);
        this.redoList.push(action);
        this.expose(true);
    }

    redo() {
        if (this.redoList.length == 0) return;

        let action = this.redoList.pop().invert();
        this.takeAction(action);
        this.undoList.push(action);
        this.expose(true);
    }

    setActor(actor: Iterator<CubeAction> | null) {
        if (actor) {
            this.actor = actor;
            this.nextMove();
        } else {
            this.actor = null;
        }
        return this.actor;
    }

    private nextMove() {
        if (!this.actor) return;
        let { done, value } = this.actor.next();
        if (done) {
            this.actor = null;
        } else {
            this.action(value, this.actor);
        }
    }

    render(dt: number) {
        let fov = +this.settings.get("fov");
        let zoom = +this.settings.get("zoom");
        let speed = +this.settings.get("speed");

        dt /= 1 - speed;

        let lightFade = +this.settings.get("lightFade");
        let shininess = +this.settings.get("shininess");

        let left = this.width > this.height
            ? fov * this.width / this.height : fov;
        let top = this.height > this.width
            ? fov * this.height / this.width : fov;
        this.renderer.setProjection(left, top, 0.1, 100);

        let depth = -1 / (zoom * fov) - 1;

        this.clear(0, 0.1, 0.2);

        this.renderer.setTexture(this.pieceTexture);
        this.renderer.setLight(lightFade);

        this.cube.move(new Vector(0, 0, depth));
        this.cube.render(this.renderer, dt);

        if (this.cube.isAnimating()) this.expose();
    }

    click(handler: ClickHandler) {
        if (handler.button == 0) {
            let fov = +this.settings.get("fov")
            let src = this.cube.intersect(handler.pos.getLine(fov));
            if (src) {
                this.setActor(null);
                handler.onRelease.bind(pos => {
                    let dst = this.cube.intersectFace(src.face, pos.getLine(fov));
                    let di = dst.i - src.i;
                    let dj = dst.j - src.j;
                    if (Math.abs(di) + Math.abs(dj) < 1e-3) return;

                    if (Math.abs(di) > Math.abs(dj)) {
                        let axis = src.face < 4 ? 2 : 1;
                        let index = Math.floor(src.j * this.cube.size);
                        let angle = src.face == 2 || src.face == 3 ? -1 : 1;
                        if (src.face % 2) angle = -angle;
                        if (di < 0) angle = -angle;
                        this.action(new CubeAction(
                            new CubeSlice(this.cube.size, axis, index),
                            angle
                        ));
                    } else {
                        let axis = src.face < 2 ? 1 : 0;
                        let index = Math.floor(src.i * this.cube.size);
                        let angle = src.face == 2 || src.face == 3 ? 1 : -1;
                        if (src.face % 2 == 1) angle = -angle;
                        if (dj < 0) angle = -angle;
                        this.action(new CubeAction(
                            new CubeSlice(this.cube.size, axis, index),
                            angle
                        ));
                    }
                });
                return;
            }
        }
        handler.onMotion.bind(({ dx, dy }) => {
            this.expose();
            let distance = Math.hypot(dx, dy);
            if (distance > 1e-5) {
                let axis = Vector.unit(-dy, dx, 0);
                this.cube.rotate(axis, 3 * distance);
            }
        });
    }
}
