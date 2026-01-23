import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelArtComponent } from '../pixel-art/pixel-art.component';
import { NgForOf } from '@angular/common';

@Component({
    templateUrl: './pixel-art-shell.component.html',
    styleUrls: ['./pixel-art-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PixelArtComponent, NgForOf],
})
export class PixelArtShellComponent {
    numSequence(n: number): Array<number> {
        return Array(n);
    }
}
