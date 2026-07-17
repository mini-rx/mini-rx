import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Product } from '../models/product';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { altKeyPressed$ } from '../../../core/utils';

const productApiUrl = 'api/products/';
const failingProductApiUrl = 'api/products-not-ok';
let apiUrl = productApiUrl;

altKeyPressed$.subscribe(updateApiUrl);

function updateApiUrl(altKeyPressed: boolean) {
    apiUrl = altKeyPressed ? failingProductApiUrl : productApiUrl;
}

@Injectable({
    providedIn: 'root',
})
export class ProductsApiService {
    private http = inject(HttpClient);
    private errorHandler = inject(ErrorHandlerService);
    private toastr = inject(ToastrService);

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(apiUrl).pipe(
            tap((data) => {
                console.log(JSON.stringify(data));
            }),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }

    createProduct(product: Product): Observable<Product> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        // Product Id must be null for the Web API to assign an Id
        const newProduct = { ...product, id: null };
        return this.http.post<Product>(apiUrl, newProduct, { headers }).pipe(
            tap((data) => {
                console.log('createProduct: ' + JSON.stringify(data));
                this.toastr.success('Product created');
            }),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }

    deleteProduct(id: number): Observable<Product> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const url = `${apiUrl}/${id}`;
        return this.http.delete<Product>(url, { headers }).pipe(
            tap(() => {
                console.log('deleteProduct: ' + id);
                this.toastr.success('Product deleted');
            }),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }

    updateProduct(product: Product): Observable<Product> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const url = `${apiUrl}/${product.id}`;
        return this.http.put<Product>(url, product, { headers }).pipe(
            tap(() => {
                console.log('updateProduct: ' + product.id);
                this.toastr.success('Product updated');
            }),
            // Return the product on an update
            map(() => product),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }
}
