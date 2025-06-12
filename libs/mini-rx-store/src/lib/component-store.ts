import { ComponentStoreLike } from './models';
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
    createSubSink,
    createUpdateFn,
    ExtensionId,
    MiniRxAction,
    miniRxError,
    OperationType,
    Reducer,
    StateOrCallback,
    undo,
    UpdateStateCallback,
} from '@mini-rx/common';
import { createEffectFn } from './create-effect-fn';
import { createLazyState, CreateSelectFnReturn } from './create-state';
import { createConnectFn } from './create-connect-fn';
import { createAssertState } from './assert-state';

const globalCsConfig = componentStoreConfig();

export function configureComponentStores(config: ComponentStoreConfig) {
    globalCsConfig.set(config);
}

export class ComponentStore<StateType extends object> implements ComponentStoreLike<StateType> {
    private readonly extensions: ComponentStoreExtension[] = calculateExtensions(
        this.config,
        globalCsConfig.get()
    );
    private readonly hasUndoExtension: boolean = this.extensions.some(
        (ext) => ext.id === ExtensionId.UNDO
    );

    private actionsOnQueue = createActionsOnQueue();

    private _state = createLazyState<StateType>();
    get state(): StateType {
        this.assertState.isInitialized();
        return this._state.get()!;
    }

    private updateState: UpdateStateCallback<StateType> = (
        stateOrCallback: StateOrCallback<StateType>,
        operationType: OperationType,
        name: string | undefined
    ): MiniRxAction<StateType> => {
        this.assertState.isInitialized();
        return this.actionsOnQueue.dispatch({
            type: createMiniRxActionType(operationType, componentStoreFeatureKey, name),
            stateOrCallback,
        });
    };

    private subSink = createSubSink();
    private assertState = createAssertState(this.constructor.name, this._state);

    constructor(initialState?: StateType, private config?: ComponentStoreConfig) {
        if (initialState) {
            this.setInitialState(initialState);
        }
    }

    setInitialState(initialState: StateType): void {
        this.assertState.isNotInitialized();

        const reducer: Reducer<StateType> = createComponentStoreReducer(
            initialState,
            this.extensions
        );

        this.subSink.sink = this.actionsOnQueue.actions$.subscribe((action) => {
            const newState: StateType = reducer(
                this._state.get()!, // Initially undefined, but the reducer can handle undefined (by falling back to initial state)
                action
            );
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
    connect = createConnectFn(this.updateState, this.subSink);
    effect = createEffectFn(this.subSink);
    select: CreateSelectFnReturn<StateType> = this._state.select;

    destroy() {
        if (this._state.get()) {
            // Dispatch an action really just for logging via LoggerExtension
            // Only dispatch if an initial state was provided or setInitialState was called
            this.actionsOnQueue.dispatch({
                type: createMiniRxActionType(OperationType.DESTROY, componentStoreFeatureKey),
            });
        }
        this.subSink.unsubscribe();
    }

    /**
     * @internal
     * Can be called by Angular if ComponentStore/FeatureStore is provided in a component
     */
    ngOnDestroy() {
        this.destroy();
    }
}

export function createComponentStore<T extends object>(
    initialState?: T | undefined,
    config?: ComponentStoreConfig
): ComponentStore<T> {
    return new ComponentStore<T>(initialState, config);
}
