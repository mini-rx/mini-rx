import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import {
    ImmutableStateExtension,
    LoggerExtension,
    provideEffects,
    provideStore,
    ReduxDevtoolsExtension,
    UndoExtension,
} from '@mini-rx/signal-store';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { DbService } from './api/db.service';
import { productsReducer } from './products/state/products.reducer';
import { ProductsEffects } from './products/state/products.effects';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withXhr()),
        provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
        provideAnimations(),
        provideToastr(),
        importProvidersFrom(
            HttpClientInMemoryWebApiModule.forRoot(DbService, {
                delay: 500,
                put204: false,
            })
        ),
        // 👇 MiniRx
        provideStore({
            reducers: {
                products: productsReducer,
            },
            extensions: [
                new ImmutableStateExtension(),
                new UndoExtension(),
                new LoggerExtension(),
                new ReduxDevtoolsExtension({
                    name: 'MiniRx Angular Demo',
                    maxAge: 25,
                    latency: 250,
                    trace: true,
                    traceLimit: 25,
                }),
            ],
        }),
        provideEffects(ProductsEffects),
    ],
};
