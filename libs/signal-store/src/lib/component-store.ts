import { DestroyRef, inject, signal, untracked } from '@angular/core';
import {
    Action,
    calculateExtensions,
    componentStoreConfig,
    ComponentStoreConfig,
    ComponentStoreExtension,
    componentStoreFeatureKey,
    createActionsOnQueue,
    createComponentStoreReducer,
    createMiniRxActionType,
    createUpdateFn,
    ExtensionId,
    MiniRxAction,
    miniRxError,
    OperationType,
    StateOrCallback,
    undo,
    UpdateStateCallback,
} from '@mini-rx/common';
import { createSelectableWritableSignal } from './create-selectable-signal';
import { ComponentStoreLike } from './models';
import { createRxEffectFn } from './create-rx-effect-fn';
import { createConnectFn } from './create-connect-fn';
import { createSignalStoreSubSink } from './signal-store-sub-sink';

export const globalCsConfig = componentStoreConfig();

export class ComponentStore<StateType extends object> implements ComponentStoreLike<StateType> {
    private readonly extensions: ComponentStoreExtension[] = calculateExtensions(
        this.config,
        globalCsConfig.get()
    );
    private readonly hasUndoExtension: boolean = this.extensions.some(
        (ext) => ext.id === ExtensionId.UNDO
    );

    private actionsOnQueue = createActionsOnQueue();

    private _state = createSelectableWritableSignal(signal(this.initialState));
    get state(): StateType {
        return untracked(() => this._state.get());
    }

    private updateState: UpdateStateCallback<StateType> = (
        stateOrCallback: StateOrCallback<StateType>,
        operationType: OperationType,
        name: string | undefined
    ): MiniRxAction<StateType> => {
        return this.actionsOnQueue.dispatch({
            type: createMiniRxActionType(operationType, componentStoreFeatureKey, name),
            stateOrCallback,
        });
    };

    constructor(private initialState: StateType, private config?: ComponentStoreConfig) {
        inject(DestroyRef).onDestroy(() => this.destroy());

        const reducer = createComponentStoreReducer(initialState, this.extensions);

        const subSink = createSignalStoreSubSink();
        subSink.sink = this.actionsOnQueue.actions$.subscribe((action) => {
            const newState: StateType = reducer(this.state, action);
            this._state.set(newState);
        });

        this.actionsOnQueue.dispatch({
            type: createMiniRxActionType(OperationType.INIT, componentStoreFeatureKey),
        });
    }

    undo(action: Action): void {
        this.hasUndoExtension
            ? this.actionsOnQueue.dispatch(undo(action))
            : miniRxError(`${this.constructor.name} has no UndoExtension yet.`);
    }

    setState = createUpdateFn(this.updateState);
    connect = createConnectFn(this.updateState);
    rxEffect = createRxEffectFn();
    select = this._state.select;

    private destroy(): void {
        // Dispatch an action really just for logging via LoggerExtension
        this.actionsOnQueue.dispatch({
            type: createMiniRxActionType(OperationType.DESTROY, componentStoreFeatureKey),
        });
    }
}

export function createComponentStore<T extends object>(
    initialState: T,
    config?: ComponentStoreConfig
): ComponentStore<T> {
    return new ComponentStore<T>(initialState, config);
}
