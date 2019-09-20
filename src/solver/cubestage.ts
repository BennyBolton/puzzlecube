"use strict";


import { Stage, StageModel, ModelAction } from "./stage";
import { Sequence } from "./sequence";
import { CubeOrientation, Face } from "../model";



class Action implements ModelAction<CubeModel> {
    public readonly length: number = this.sequence.getLength();

    constructor(private readonly sequence: Sequence) {}

    weighModel(model: CubeModel) {
        return model.weight;
    }

    *getActions(cube: CubeOrientation) {
        yield* this.sequence.getActions(cube);
    }
}



export abstract class CubeModel implements StageModel<CubeStage, Action> {
    public readonly weight: number;

    constructor(
        private readonly cube: CubeOrientation,
        weight?: number
    ) {
        this.weight = weight === undefined ? this.weigh(cube) : weight;
    }

    weighAction(action: Action) {
        let cube = this.cube.clone();
        for (let i of action.getActions(cube)) {
            i.act();
        }
        return this.weigh(cube);
    }

    abstract weigh(cube: CubeOrientation): number;
    abstract getSequences(): Iterable<Sequence>;
}



export interface CubeModelConstructor {
    new(cube: CubeOrientation, weight?: number): CubeModel;
}



export class CubeStage extends Stage<CubeModel> {
    constructor(private readonly model: CubeModelConstructor) {
        super();
    }

    *realign(cube: CubeOrientation) {
        yield cube;
        yield cube.reorient(Face.Top, Face.Left, Face.Front);
        yield cube.reorient(Face.Right, Face.Front, Face.Bottom);
        yield cube.reorient(Face.Bottom, Face.Right, Face.Front);
        yield cube.reorient(Face.Right, Face.Back, Face.Top);
        yield cube.reorient(Face.Left, Face.Bottom, Face.Back);
    }

    *transform(cube: CubeOrientation) {
        yield cube;
        yield cube.rotate(Face.Top, 1);
        yield cube.rotate(Face.Top, 2);
        yield cube.rotate(Face.Top, 3);

        yield cube = cube.reorient(Face.Front, Face.Top, Face.Right);
        yield cube.rotate(Face.Top, 1);
        yield cube.rotate(Face.Top, 2);
        yield cube.rotate(Face.Top, 3);
    }

    makeModel(cube: CubeOrientation, weight?: number) {
        return new this.model(cube, weight);
    }

    *getActions(model: CubeModel) {
        for (let sequence of model.getSequences()) {
            yield new Action(sequence);
        }
    }
}
