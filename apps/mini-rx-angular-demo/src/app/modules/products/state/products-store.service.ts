import { Injectable, inject } from '@angular/core';

import * as fromProducts from './products.reducer';
import { createFeatureSelector, createSelector, Store } from 'mini-rx-store';
import {
    addProductToCart,
    clearCurrentProduct,
    createProduct,
    deleteProduct,
    initializeNewProduct,
    load,
    removeProductFromCart,
    selectProduct,
    toggleProductCode,
    updateProduct,
    updateSearch,
} from './products.actions';
import { Product } from '../models/product';
import { Observable } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { featureKeyUser, UserState } from '../../user/state/user-store.service';

// MEMOIZED SELECTORS
const getProductFeatureState = createFeatureSelector<fromProducts.ProductState>('products');
const getShowProductCode = createSelector(getProductFeatureState, (state) => state.showProductCode);
const getSelectedProduct = createSelector(getProductFeatureState, (state) => state.selectedProduct);
const getProducts = createSelector(getProductFeatureState, (state) => state.products);
const getSearch = createSelector(getProductFeatureState, (state) => state.search);
const getFilteredProducts = createSelector(getProducts, getSearch, (products, search) => {
    return products.filter(
        (item) => item.productName.toUpperCase().indexOf(search.toUpperCase()) > -1
    );
});
const getCartItems = createSelector(getProductFeatureState, (state) => state.cart);
const getCartItemsWithExtraData = createSelector(
    getProducts,
    getCartItems,
    (products, cartItems) => {
        return cartItems.reduce<CartItem[]>((accumulated, cartItem) => {
            const foundProduct: Product | undefined = products.find(
                (product) => product.id === cartItem.productId
            );
            if (foundProduct) {
                const newCartItem: CartItem = {
                    ...cartItem,
                    productName: foundProduct.productName,
                    total:
                        typeof foundProduct.price !== 'undefined'
                            ? foundProduct.price * cartItem.amount
                            : 0,
                };
                return [...accumulated, newCartItem];
            }
            return accumulated;
        }, []);
    }
);
const getCartItemsAmount = createSelector(getCartItemsWithExtraData, (cartItems) => {
    return cartItems.length;
});
const getHasCartItems = createSelector(getCartItemsAmount, (amount) => {
    return amount > 0;
});
const getCartTotalPrice = createSelector(getCartItemsWithExtraData, (cartItemsWithExtra) =>
    cartItemsWithExtra.reduce<number>((previousValue: number, currentValue: CartItem) => {
        if (typeof currentValue.total !== 'undefined') {
            return previousValue + currentValue.total;
        }
        return previousValue;
    }, 0)
);

const getUserFeatureState = createFeatureSelector<UserState>(featureKeyUser);
const getPermissions = createSelector(getUserFeatureState, (state) => state.permissions);
const getDetailTitle = createSelector(
    getPermissions,
    getSelectedProduct,
    (permissions, product) => {
        if (permissions.canUpdateProducts) {
            return product && product.id ? 'Edit Product' : 'Create Product';
        }
        return 'View Product';
    }
);

@Injectable({
    providedIn: 'root',
})
export class ProductsStore {
    private store = inject(Store);

    // STATE OBSERVABLES
    displayCode$: Observable<boolean> = this.store.select(getShowProductCode);
    selectedProduct$: Observable<Product | undefined> = this.store.select(getSelectedProduct);
    products$: Observable<Product[]> = this.store.select(getFilteredProducts);
    search$: Observable<string> = this.store.select(getSearch);
    cartItems$: Observable<CartItem[]> = this.store.select(getCartItemsWithExtraData);
    cartItemsAmount$: Observable<number> = this.store.select(getCartItemsAmount);
    cartTotalPrice$: Observable<number> = this.store.select(getCartTotalPrice);
    hasCartItems$: Observable<boolean> = this.store.select(getHasCartItems);
    detailTitle$: Observable<string> = this.store.select(getDetailTitle);

    constructor() {
        this.load();
    }

    private load() {
        this.store.dispatch(load());
    }

    toggleProductCode(value: boolean) {
        this.store.dispatch(toggleProductCode(value));
    }

    newProduct(): void {
        this.store.dispatch(initializeNewProduct());
    }

    selectProduct(product: Product): void {
        this.store.dispatch(selectProduct(product));
    }

    clearCurrentProduct(): void {
        this.store.dispatch(clearCurrentProduct());
    }

    create(product: Product): void {
        this.store.dispatch(createProduct(product));
    }

    update(product: Product): void {
        this.store.dispatch(updateProduct(product));
    }

    delete(product: Product): void {
        this.store.dispatch(deleteProduct(product.id!));
    }

    updateSearch(search: string) {
        this.store.dispatch(updateSearch(search));
    }

    addProductToCart(product: Product) {
        this.store.dispatch(addProductToCart(product.id!));
    }

    removeProductFromCart(cartItem: CartItem) {
        this.store.dispatch(removeProductFromCart(cartItem.productId!));
    }
}
