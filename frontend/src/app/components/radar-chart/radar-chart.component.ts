import { Component, Input, OnChanges } from '@angular/core';

export interface RadarDataPoint {
    label: string;
    value: number; // 0-100
}

interface Pt { x: number; y: number; }

@Component({
    selector: 'app-radar-chart',
    standalone: false,
    template: `
    <svg [attr.viewBox]="'-32 -32 ' + (size + 64) + ' ' + (size + 64)" class="radar-svg">
      <!-- Grid polygons at 25 / 50 / 75 / 100% -->
      <polygon *ngFor="let pts of gridPolygons; let gi = index"
               [attr.points]="pts"
               [attr.fill]="gi === 3 ? 'rgba(63,81,181,0.04)' : 'none'"
               [attr.stroke]="gi === 3 ? '#b3bcf5' : '#e8eaf6'"
               stroke-width="1"/>
      <!-- Axis lines -->
      <line *ngFor="let p of axisPoints"
            [attr.x1]="cx" [attr.y1]="cy"
            [attr.x2]="p.x" [attr.y2]="p.y"
            stroke="#dde2f0" stroke-width="1"/>
      <!-- Data polygon -->
      <polygon *ngIf="dataPolygonStr"
               [attr.points]="dataPolygonStr"
               fill="rgba(63,81,181,0.18)" stroke="#3f51b5" stroke-width="2.5"
               stroke-linejoin="round"/>
      <!-- Data point circles -->
      <circle *ngFor="let p of dataCircles"
              [attr.cx]="p.x" [attr.cy]="p.y" r="5"
              fill="#3f51b5" stroke="white" stroke-width="2"/>
      <!-- Domain labels -->
      <text *ngFor="let l of labelPts"
            [attr.x]="l.x" [attr.y]="l.y"
            [attr.text-anchor]="l.anchor"
            [attr.dy]="l.dy"
            class="rl">{{ l.text }}</text>
    </svg>
  `,
    styles: [
        `:host { display: block; }`,
        `.radar-svg { display: block; width: 100%; height: auto; }`,
        `.rl { font-size: 11.5px; fill: #37474f; font-weight: 600;
           font-family: Roboto, "Helvetica Neue", sans-serif; }`,
    ],
})
export class RadarChartComponent implements OnChanges {
    @Input() data: RadarDataPoint[] = [];
    @Input() size = 240;

    cx = 120; cy = 120; radius = 80;

    axisPoints: Pt[] = [];
    gridPolygons: string[] = [];
    dataPolygonStr = '';
    dataCircles: Pt[] = [];
    labelPts: { x: number; y: number; text: string; anchor: string; dy: string }[] = [];

    private readonly LEVELS = [25, 50, 75, 100];

    ngOnChanges() {
        this.cx = this.size / 2;
        this.cy = this.size / 2;
        this.radius = this.size / 2 - 40;
        this.compute();
    }

    private ang(i: number): number {
        return -Math.PI / 2 + (2 * Math.PI * i / this.data.length);
    }

    private pt(i: number, frac: number): Pt {
        const a = this.ang(i);
        return {
            x: +(this.cx + this.radius * frac * Math.cos(a)).toFixed(2),
            y: +(this.cy + this.radius * frac * Math.sin(a)).toFixed(2),
        };
    }

    private compute() {
        const n = this.data.length;
        if (n < 3) return;

        this.axisPoints = this.data.map((_, i) => this.pt(i, 1));

        this.gridPolygons = this.LEVELS.map(l =>
            this.data.map((_, i) => { const p = this.pt(i, l / 100); return `${p.x},${p.y}`; }).join(' ')
        );

        const fracs = this.data.map(d => Math.max(0, Math.min(100, d.value)) / 100);
        this.dataPolygonStr = this.data.map((_, i) => {
            const p = this.pt(i, fracs[i]);
            return `${p.x},${p.y}`;
        }).join(' ');

        this.dataCircles = this.data.map((_, i) => this.pt(i, fracs[i]));

        const LO = 22;
        this.labelPts = this.data.map((d, i) => {
            const a = this.ang(i);
            const x = +(this.cx + (this.radius + LO) * Math.cos(a)).toFixed(2);
            const y = +(this.cy + (this.radius + LO) * Math.sin(a)).toFixed(2);
            let anchor = 'middle';
            if (Math.cos(a) < -0.25) anchor = 'end';
            else if (Math.cos(a) > 0.25) anchor = 'start';
            const sinA = Math.sin(a);
            const dy = sinA < -0.4 ? '-0.4em' : sinA > 0.4 ? '0.9em' : '0.35em';
            return { x, y, text: d.label, anchor, dy };
        });
    }
}
