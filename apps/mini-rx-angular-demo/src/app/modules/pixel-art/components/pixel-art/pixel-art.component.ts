import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ArtStoreService } from '../../state/art-store.service';

@Component({
    selector: 'app-pixel-art',
    templateUrl: './pixel-art.component.html',
    styleUrls: ['./pixel-art.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ArtStoreService],
    standalone: false,
})
export class PixelArtComponent {
    artStore = inject(ArtStoreService);

    @HostListener('mouseover', ['$event']) onHover(e: MouseEvent) {
        this.artStore.reset();
    }
}
