import { DestroyRef, inject, Signal, untracked } from '@angular/core';
import {
    Action,
    createFeatureStoreReducer,
    createMiniRxActionType,
    createUpdateFn,
    FeatureStoreConfig,
    generateFeatureKey,
    generateId,
    MiniRxAction,
    miniRxError,
    OperationType,
    StateOrCallback,
    undo,
    UpdateStateCallback,
} from '@mini-rx/common';
import { storeCore } from './store-core';
import { createSelectableSignal } from './create-selectable-signal';
import { ComponentStoreLike } from './models';
import { createRxEffectFn } from './create-rx-effect-fn';
import { createConnectFn } from './create-connect-fn';

export class FeatureStore<StateType extends object> implements ComponentStoreLike<StateType> {
    private readonly featureId: string;
    private readonly _featureKey: string;
    get featureKey(): string {
        return this._featureKey;
    }

    private _state: Signal<StateType> = storeCore.appState.select(
        (state) => state[this.featureKey]
    );
    get state(): StateType {
        return untracked(() => this._state());
    }

    private updateState: UpdateStateCallback<StateType> = (
        stateOrCallback: StateOrCallback<StateType>,
        operationType: OperationType,
        name: string | undefined
    ): MiniRxAction<StateType> => {
        return storeCore.dispatch({
            type: createMiniRxActionType(operationType, this.featureKey, name),
            stateOrCallback,
            featureId: this.featureId,
        });
    };

    constructor(featureKey: string, initialState: StateType, config: FeatureStoreConfig = {}) {
        this.featureId = generateId();
        this._featureKey = generateFeatureKey(featureKey, config.multi);

        storeCore.addFeature<StateType>(
            this._featureKey,
            createFeatureStoreReducer(this.featureId, initialState)
        );

        inject(DestroyRef).onDestroy(() => this.destroy());
    }

    undo(action: Action): void {
        storeCore.hasUndoExtension
            ? storeCore.dispatch(undo(action))
            : miniRxError('UndoExtension is not initialized.');
    }

    setState = createUpdateFn(this.updateState);
    connect = createConnectFn(this.updateState);
    rxEffect = createRxEffectFn();
    select = createSelectableSignal(this._state).select;

    private destroy(): void {
        storeCore.removeFeature(this._featureKey);
    }
}

export function createFeatureStore<T extends object>(
    featureKey: string,
    initialState: T,
    config: FeatureStoreConfig = {}
): FeatureStore<T> {
    return new FeatureStore<T>(featureKey, initialState, config);
}
