"use strict";



export class Throttle {
    private handle: number | null = null;
    private cb: (() => void) | null = null;

    constructor(private readonly timeout = 0) {}

    call(cb: () => void) {
        this.cb = cb;
        if (this.handle == null) {
            this.handle = setTimeout(() => this.emit(), this.timeout);
        }
    }

    private emit() {
        this.handle = null;
        if (this.cb) this.cb();
        this.cb = null;
    }
}
