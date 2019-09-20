"use strict";


import { CubeOrientation, CubeAction } from "../model";



export interface ModelAction<M extends StageModel<any, any>> {
    readonly length: number;
    getActions(cube: CubeOrientation): Iterable<CubeAction>;
}



export interface StageModel<S extends Stage<any>, A extends ModelAction<any>> {
    readonly weight: number;
    weighAction(action: A): number;
}



class BestOption<T> {
    public option = null as T | null;

    constructor(public weight = [Infinity]) {}

    consider(option: T, ...weight: number[]) {
        for (let i = 0; i < this.weight.length; ++i) {
            if (weight[i] < this.weight[i]) {
                this.option = option;
                this.weight = weight;
            } else if (weight[i] > this.weight[i]) {
                return;
            }
        }
    }
}



export abstract class Stage<M extends StageModel<any, any>> {
    abstract realign(cube: CubeOrientation): Iterable<CubeOrientation>;
    abstract transform(cube: CubeOrientation): Iterable<CubeOrientation>;
    abstract makeModel(cube: CubeOrientation, weight?: number): M;
    abstract getActions(model: M): Iterable<ModelAction<M>>;

    *runStage(baseCube: CubeOrientation) {
        let best = new BestOption<CubeOrientation>();
        for (let cube of this.realign(baseCube)) {
            let model = this.makeModel(cube);
            best.consider(cube, model.weight);
        }
        if (!best.option) return;

        baseCube = best.option;
        let baseWeight = best.weight[0];

        while (baseWeight > 0) {
            let best = new BestOption<[CubeOrientation, ModelAction<M>]>
                ([baseWeight, 0]);
            for (let cube of this.transform(baseCube)) {
                let model = this.makeModel(cube, baseWeight);
                for (let action of this.getActions(model)) {
                    let weight = model.weighAction(action);
                    best.consider([cube, action], weight, action.length);
                }
            }

            if (!best.option) break;
            let [ cube, action ] = best.option;

            yield* action.getActions(cube);

            baseCube = cube;
            baseWeight = best.weight[0];
        }
    }
}
