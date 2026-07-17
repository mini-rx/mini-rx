import { Injectable, inject } from '@angular/core';
import { mergeMap, startWith } from 'rxjs/operators';
import { Action, Actions, createEffect, mapResponse, undo } from 'mini-rx-store';
import { ofType, toPayload } from 'ts-action-operators';
import {
    createProduct,
    createProductFail,
    createProductSuccess,
    deleteProduct,
    deleteProductFail,
    deleteProductSuccess,
    load,
    loadFail,
    loadSuccess,
    updateProduct,
    updateProductFail,
    updateProductOptimistic,
    updateProductSuccess,
} from './products.actions';
import { Product } from '../models/product';
import { ProductsApiService } from '../services/products-api.service';

@Injectable()
export class ProductsEffects {
    private productService = inject(ProductsApiService);
    private actions$ = inject(Actions);

    loadProducts$ = createEffect(
        this.actions$.pipe(
            ofType(load),
            mergeMap(() =>
                this.productService.getProducts().pipe(
                    mapResponse(
                        (products) => loadSuccess(products),
                        (error) => loadFail(error)
                    )
                )
            )
        )
    );

    // Effect with optimistic update and undo
    updateProduct$ = createEffect(
        this.actions$.pipe(
            ofType(updateProduct),
            toPayload(),
            mergeMap((product) => {
                const optimisticUpdateAction: Action = updateProductOptimistic(product);

                return this.productService.updateProduct(product).pipe(
                    mapResponse(
                        (updatedProduct) => updateProductSuccess(updatedProduct),
                        (err) => [updateProductFail(err), undo(optimisticUpdateAction)]
                    ),
                    startWith(optimisticUpdateAction)
                );
            })
        )
    );

    createProduct$ = createEffect(
        this.actions$.pipe(
            ofType(createProduct),
            toPayload(),
            mergeMap((product: Product) =>
                this.productService.createProduct(product).pipe(
                    mapResponse(
                        (newProduct) => createProductSuccess(newProduct),
                        (err) => createProductFail(err)
                    )
                )
            )
        )
    );

    deleteProduct$ = createEffect(
        this.actions$.pipe(
            ofType(deleteProduct),
            toPayload(),
            mergeMap((productId: number) =>
                this.productService.deleteProduct(productId).pipe(
                    mapResponse(
                        () => deleteProductSuccess(productId),
                        (err) => deleteProductFail(err)
                    )
                )
            )
        )
    );
}
