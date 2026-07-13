import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    private toastr = inject(ToastrService);

    handleError(err: any): Observable<never> {
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `An error occurred: ${err.error.message}`;
        } else {
            // API error
            errorMessage = `${err.statusText}: ${err.status}`;
        }
        console.error(err);
        this.toastr.error(errorMessage);
        return throwError(errorMessage);
    }
}
