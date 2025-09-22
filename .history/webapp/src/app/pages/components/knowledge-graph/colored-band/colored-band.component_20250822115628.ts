import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-colored-band',
  templateUrl: './colored-band.component.html',
  styleUrls: ['./colored-band.component.css']
})
export class ColoredBandComponent implements OnInit {
  @Input() document_dnu_similarity_colorband: { [key: string]: number } = {};
  @Input() tags: { text: string, color: string }[] = [];

  bands: { color: string, height: number, label: string }[] = [];

/*   ngOnInit(): void {
    const values = Object.values(this.document_dnu_similarity_colorband);
    const total = Math.round(values.reduce((a, b) => a + b, 0));

    for (const [int, sim] of Object.entries(this.document_dnu_similarity_colorband)) {
      if (Math.round(sim) !== 0) {
        const height = Math.round(sim * 10000) / total;
        const tag = this.tags.find(t => t.text === int);
        if (tag) {
          this.bands.push({
            color: tag.color,
            height: height,
            label: `${Math.round(sim*100)}%`
          });
        }
      }
    }
  } */
    /* ngOnInit(): void {
      const values = Object.values(this.document_dnu_similarity_colorband);
      const total = values.reduce((a, b) => a + b, 0); // Do NOT round here
    
      // Prevent division by zero
      if (total === 0) {
        return; // or handle gracefully
      }
    
      for (const [int, sim] of Object.entries(this.document_dnu_similarity_colorband)) {
        const tag = this.tags.find(t => t.text === int);
        if (tag) {
          const percentage = (sim / total) * 100;
    
          // Optional: skip very small values
          if (percentage > 0) {
            this.bands.push({
              color: tag.color,
              height: percentage,
              label: `${Math.round(percentage)}%`
            });
          }
        }
      }
    } */

 /*   ngOnInit(): void {
    const entries = Object.entries(this.document_dnu_similarity_colorband)
      .filter(([_, sim]) => sim > 0);

    const totalSimilarity = entries.reduce((sum, [_, sim]) => sum + sim, 0);

    if (totalSimilarity === 0) return;

    for (const [dnu, sim] of entries) {
      const tag = this.tags.find(t => t.text === dnu);
      if (tag) {
        const heightPercentage = (sim / totalSimilarity) * 100;

        this.bands.push({
          color: tag.color,
          height: heightPercentage,  // percentage of total height
          label: `${Math.round((sim / totalSimilarity) * 100)}%`

        });
      }
    }
    }   */

     ngOnInit(): void {
    const entries = Object.entries(this.document_dnu_similarity_colorband)
      .filter(([_, sim]) => sim > 0);

    const maxSimilarity = Math.max(...entries.map(([_, sim]) => sim));

    if (maxSimilarity === 0) return;

    for (const [dnu, sim] of entries) {
      const tag = this.tags.find(t => t.text === dnu);
      if (tag) {
        this.bands.push({
          color: tag.color,
          height: (sim / maxSimilarity) * 100, // scale by max similarity
          label: `${Math.round(sim * 100)}%`    // display actual similarity as %
        });
      }
    }
  }
}
