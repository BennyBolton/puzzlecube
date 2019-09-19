"use strict";


import { CubeOrientation, CubeAction } from "../model";



export abstract class ModelAction<M extends StageModel<any>> {
    constructor(public readonly weight: number) {}

    abstract alterModel(model: M): M;
    abstract alterCube(cube: CubeOrientation): Iterable<CubeAction>;
}



export abstract class StageModel<S extends Stage<any>> {
    abstract getCube(): CubeOrientation;
    abstract transform(): Iterable<StageModel<S>>;
    abstract weigh(): number;
}



class BestOption<T> {
    public option = null as T | null;

    constructor(public weight = Infinity) {}

    consider(option: T, weight: number) {
        if (weight < this.weight) {
            this.option = option;
            this.weight = weight;
        }
    }
}



export abstract class Stage<M extends StageModel<any>> {
    abstract transform(cube: CubeOrientation): Iterable<CubeOrientation>;
    abstract makeModel(cube: CubeOrientation): M;
    abstract getActions(): Iterable<ModelAction<M>>;

    *runStage(baseCube: CubeOrientation) {
        let it = this.transform(baseCube)[Symbol.iterator]();
        let { done, value: cube } = it.next();
        if (done) return;

        let baseModel = this.makeModel(cube);
        let baseWeight = baseModel.weigh();

        while (baseWeight > 0) {
            let best = new BestOption<[M, ModelAction<M>]>(baseWeight);

            for (let action of this.getActions()) {
                for (let model of baseModel.transform() as Iterable<M>) {
                    let weight = action.alterModel(model).weigh();
                    best.consider([model, action], weight);
                }
            }

            if (!best.option) break;
            let [ model, action ] = best.option;

            cube = model.getCube();
            yield* action.alterCube(model.getCube());
            baseModel = this.makeModel(cube);
            baseWeight = baseModel.weigh();
            if (baseWeight != best.weight) {
                throw new Error("Internal Error: Incorrect weight");
            }
        }
    }
}
