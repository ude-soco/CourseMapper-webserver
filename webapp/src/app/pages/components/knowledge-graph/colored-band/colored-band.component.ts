import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-colored-band',
  templateUrl: './colored-band.component.html',
  styleUrls: ['./colored-band.component.css'],
})
export class ColoredBandComponent implements OnInit {
  @Input() document_dnu_similarity_colorband: { [key: string]: number } = {};
  @Input() tags: { text: string; color: string }[] = [];
  @Input() resourceTitle: string = '';

  bands: { color: string; height: number; label: string }[] = [];
  @Input() contentType: 'article' | 'video' = 'article';

  tooltipText: string = ''; // for the whole color band
  ngOnInit(): void {
    const entries = Object.entries(
      this.document_dnu_similarity_colorband
    ).filter(([_, sim]) => sim > 0);

    const maxSimilarity = Math.max(...entries.map(([_, sim]) => sim));

    if (maxSimilarity === 0) return;

    const tooltipParts: string[] = [];

    for (const [dnu, sim] of entries) {
      const tag = this.tags.find((t) => t.text === dnu);
      if (tag) {
        const similarityPercent = Math.round(sim * 100);
        this.bands.push({
          color: tag.color,
          height: (sim / maxSimilarity) * 100,
          label: `${similarityPercent}%`,
        });
        tooltipParts.push(`${similarityPercent}% related to concept: "${dnu}"`);
      }
    }

    if (tooltipParts.length > 0) {
      const contentLabel =
        this.contentType === 'video' ? 'This video' : 'This article';
      this.tooltipText = `${contentLabel} "${
        this.resourceTitle
      }" is ${tooltipParts.join(' and ')}.`;
    }
  }

  
}
