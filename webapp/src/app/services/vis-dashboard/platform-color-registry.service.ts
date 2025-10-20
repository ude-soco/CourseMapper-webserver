import { Injectable } from '@angular/core';

type Color = string;

/** Single source of truth for platform colors. */
@Injectable({ providedIn: 'root' })
export class PlatformColorRegistry {
  /** Accessible, repeatable palette */
  private readonly palette: Color[] = [
    '#1E88E5', '#00BFA5', '#FFC107', '#FF5277', '#7E57C2',
    '#43A047', '#1565C0', '#F4511E', '#00897B', '#8E24AA',
    '#5E35B1', '#039BE5', '#6D4C41', '#00ACC1', '#D81B60',
    '#3949AB'
  ];

  /** Fixed indices for platforms (normalized keys) */
  private readonly fixed: Map<string, number> = new Map<string, number>([
    [this.norm('On Campus'), 0],
    [this.norm('KI Campus'), 1],
    [this.norm('OpenVhb'),   2],
    [this.norm('EdX'),       4], 
    [this.norm('Coursera'),  3],
    [this.norm('IMoox'),     5],
    [this.norm('Udemy'),     6],
    [this.norm('OpenHPI'),   7],
    [this.norm('Future Learn'), 8],
    [this.norm('Udacity'),   9],
  ]);

  getColor(name: string | null | undefined): Color {
    const key = this.norm(name || '');
    if (!key) return '#E0E0E0';
    const fixedIdx = this.fixed.get(key);
    if (fixedIdx !== undefined) return this.palette[fixedIdx % this.palette.length];

    // hash fallback for unknown platforms
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % this.palette.length;
    return this.palette[idx];
  }

  /** array of colors for a list (labels order) */
  paletteFor(names: string[]): string[] {
    return names.map(n => this.getColor(n));
  }

  private norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, ''); }
}
