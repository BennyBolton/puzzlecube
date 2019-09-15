"use strict";



export type Callback<T> = (value: T) => void;



export class Event<T> {
    private readonly listeners = new Set<Callback<T>>();
    private readonly oneTime = [] as Callback<T>[];

    bind(cb: Callback<T>) {
        this.listeners.add(cb);
    }

    unbind(cb: Callback<T>) {
        this.listeners.delete(cb);
    }

    once(cb: Callback<T>) {
        this.oneTime.push(cb);
    }

    emit(value: T) {
        for (let cb of this.oneTime) {
            cb(value);
        }
        this.oneTime.length = 0;

        for (let cb of this.listeners) {
            cb(value);
        }
    }
}
