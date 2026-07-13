import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    EventEmitter,
    inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-product-filter',
    templateUrl: './product-filter.component.html',
    styleUrls: ['./product-filter.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule],
})
export class ProductFilterComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Input()
    set search(search: string) {
        this.formGroup.setValue({ search }, { emitEvent: false });
    }

    @Output()
    searchChanged = new EventEmitter<string>();

    private searchInput: FormControl = new FormControl();
    formGroup: FormGroup = new FormGroup({
        search: this.searchInput,
    });

    ngOnInit(): void {
        this.searchInput.valueChanges
            .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.searchChanged.emit(value);
            });
    }
}
