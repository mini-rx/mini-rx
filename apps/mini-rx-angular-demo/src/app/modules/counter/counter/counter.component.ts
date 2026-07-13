import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from '../state/counter-store.service';

@Component({
    selector: 'app-counter',
    templateUrl: './counter.component.html',
    styleUrls: ['./counter.component.css'],
    providers: [CounterStore], // The CounterStore is provided for each counter component instance
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class CounterComponent {
    private counterStore = inject(CounterStore);

    counter$: Observable<number> = this.counterStore.count$;

    increment() {
        this.counterStore.increment();
    }

    decrement() {
        this.counterStore.decrement();
    }
}
