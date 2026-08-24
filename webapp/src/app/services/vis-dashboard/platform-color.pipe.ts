import { Pipe, PipeTransform } from '@angular/core';
import { PlatformColorRegistry } from 'src/app/services/vis-dashboard/platform-color-registry.service';

@Pipe({ name: 'platformColor', pure: true })
export class PlatformColorPipe implements PipeTransform {
  constructor(private readonly colors: PlatformColorRegistry) {}
  transform(platformName: string | null | undefined): string {
    return this.colors.getColor(platformName || '');
  }
}
