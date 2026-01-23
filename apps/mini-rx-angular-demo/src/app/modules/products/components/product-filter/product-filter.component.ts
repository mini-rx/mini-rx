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
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-product-filter',
    templateUrl: './product-filter.component.html',
    styleUrls: ['./product-filter.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ProductFilterComponent implements OnInit, OnDestroy {
    private unsubscribe$: Subject<void> = new Subject();

    @Input()
    set search(search: string) {
        this.formGroup.setValue({ search }, { emitEvent: false });
    }

    @Output()
    searchChanged = new EventEmitter<string>();

    searchInput: FormControl = new FormControl();
    formGroup: FormGroup = new FormGroup({
        search: this.searchInput,
    });

    ngOnInit(): void {
        this.searchInput.valueChanges
            .pipe(debounceTime(350), takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.searchChanged.emit(value);
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
