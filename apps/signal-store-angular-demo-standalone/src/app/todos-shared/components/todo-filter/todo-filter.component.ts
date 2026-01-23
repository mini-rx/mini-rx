import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    DestroyRef,
    inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TodoFilter } from '../../models/todo-filter';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-filter',
    templateUrl: './todo-filter.component.html',
    styleUrls: ['./todo-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
})
export class TodoFilterComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

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

    ngOnInit(): void {
        // Debounce just the text input
        this.formGroup
            .get('search')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(350))
            .subscribe((value) => {
                this.filterUpdate.emit({
                    ...this.formGroup.value,
                    search: value,
                });
            });

        this.formGroup
            .get('category')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.filterUpdate.emit({
                    ...this.formGroup.value,
                    category: value,
                });
            });
    }
}
