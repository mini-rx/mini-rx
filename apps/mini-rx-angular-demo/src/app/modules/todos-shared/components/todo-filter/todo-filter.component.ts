import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TodoFilter } from '../../models/todo-filter';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-filter',
    templateUrl: './todo-filter.component.html',
    styleUrls: ['./todo-filter.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TodoFilterComponent implements OnInit, OnDestroy {
    @Input()
    set filter(filter: TodoFilter) {
        this.formGroup.setValue(filter, { emitEvent: false });
    }

    @Output()
    filterUpdate = new EventEmitter<TodoFilter>();

    formGroup: FormGroup = new FormGroup({
        search: new FormControl(),
        category: new FormGroup({
            isBusiness: new FormControl(),
            isPrivate: new FormControl(),
        }),
    });

    private unsubscribe$: Subject<void> = new Subject();

    ngOnInit(): void {
        // Debounce just the text input
        this.formGroup
            .get('search')!
            .valueChanges.pipe(takeUntil(this.unsubscribe$), debounceTime(350))
            .subscribe((value) => {
                this.filterUpdate.emit({
                    ...this.formGroup.value,
                    search: value,
                });
            });

        this.formGroup
            .get('category')!
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.filterUpdate.emit({
                    ...this.formGroup.value,
                    category: value,
                });
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
