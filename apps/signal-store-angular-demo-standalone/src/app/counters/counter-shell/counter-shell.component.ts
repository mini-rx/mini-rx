import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CounterComponent } from '../counter/counter.component';

@Component({
    templateUrl: './counter-shell.component.html',
    styleUrls: ['./counter-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CounterComponent],
})
export class CounterShellComponent {}
