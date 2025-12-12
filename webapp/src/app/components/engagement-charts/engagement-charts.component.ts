import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OverlayPanel } from 'primeng/overlaypanel';
import { EngagementMetrics, MaterialDetail } from 'src/app/services/engagement.service';

@Component({
  selector: 'app-engagement-charts',
  templateUrl: './engagement-charts.component.html',
  styleUrls: ['./engagement-charts.component.css']
})
export class EngagementChartsComponent implements OnInit, OnChanges {
  @Input() courseName: string = 'Course name';
  @Input() engagementLevel: string = 'Low';
  @Input() engagementMetrics: EngagementMetrics | null = null;

  activeTabIndex: number = 0;
  tabs = [
    { label: 'My Activities', value: 'my-activities' },
    { label: 'My activities vs. top peers', value: 'top-peers' },
    { label: 'My activities vs. same engagement level characteristics', value: 'same-level' },
    { label: 'My activities vs. higher engagement level boundaries', value: 'higher-level' }
  ];

  @ViewChild('annotationFilterPanel') annotationFilterPanel!: OverlayPanel;
  @ViewChild('materialFilterPanel') materialFilterPanel!: OverlayPanel;
  @ViewChild('accessFilterPanel') accessFilterPanel!: OverlayPanel;
  @ViewChild('kgFilterPanel') kgFilterPanel!: OverlayPanel;
  @ViewChild('recommendationFilterPanel') recommendationFilterPanel!: OverlayPanel;

  annotationActivitiesExpanded: boolean = true;
  materialActivitiesExpanded: boolean = true;
  accessActivitiesExpanded: boolean = true;
  kgActivitiesExpanded: boolean = true;
  recommendationActivitiesExpanded: boolean = true;

  // Chart visibility states - Annotation
  addedAnnotationsVisible: boolean = true;
  annotationInteractionsVisible: boolean = true;
  likesDislikesVisible: boolean = true;
  tagsVisible: boolean = true;
  
  // Chart visibility states - Material
  pdfActivitiesVisible: boolean = true;
  videoActivitiesVisible: boolean = true;
  slidesAndVideoTimeVisible: boolean = true;
  
  // Chart visibility states - Access
  accessActivitiesVisible1: boolean = true;
  accessActivitiesVisible2: boolean = true;
  accessActivitiesVisible3: boolean = true;
  
  // Chart visibility states - KG
  kgActivitiesVisible1: boolean = true;
  kgActivitiesVisible2: boolean = true;
  kgActivitiesVisible3: boolean = true;
  
  // Chart visibility states - Recommendation
  recommendationActivitiesVisible1: boolean = true;
  recommendationActivitiesVisible2: boolean = true;
  recommendationActivitiesVisible3: boolean = true;

  // Maximized chart state
  maximizedChart: string | null = null;
  maximizedChartData: any = null;
  maximizedChartOptions: any = null;
  maximizedChartTitle: string = '';
  showMaximizedDialog: boolean = false;
  maximizedChartMaterialList: any[] = [];

  toggleAnnotationActivities(): void {
    this.annotationActivitiesExpanded = !this.annotationActivitiesExpanded;
  }

  toggleMaterialActivities(): void {
    this.materialActivitiesExpanded = !this.materialActivitiesExpanded;
  }

  toggleAccessActivities(): void {
    this.accessActivitiesExpanded = !this.accessActivitiesExpanded;
  }

  toggleKgActivities(): void {
    this.kgActivitiesExpanded = !this.kgActivitiesExpanded;
  }

  toggleRecommendationActivities(): void {
    this.recommendationActivitiesExpanded = !this.recommendationActivitiesExpanded;
  }

  toggleChart(chartName: string): void {
    switch(chartName) {
      case 'addedAnnotations':
        this.addedAnnotationsVisible = !this.addedAnnotationsVisible;
        break;
      case 'annotationInteractions':
        this.annotationInteractionsVisible = !this.annotationInteractionsVisible;
        break;
      case 'likesDislikes':
        this.likesDislikesVisible = !this.likesDislikesVisible;
        break;
      case 'tags':
        this.tagsVisible = !this.tagsVisible;
        break;
      case 'pdfActivities':
        this.pdfActivitiesVisible = !this.pdfActivitiesVisible;
        break;
      case 'videoActivities':
        this.videoActivitiesVisible = !this.videoActivitiesVisible;
        break;
      case 'slidesAndVideoTime':
        this.slidesAndVideoTimeVisible = !this.slidesAndVideoTimeVisible;
        break;
      case 'accessActivities1':
        this.accessActivitiesVisible1 = !this.accessActivitiesVisible1;
        break;
      case 'accessActivities2':
        this.accessActivitiesVisible2 = !this.accessActivitiesVisible2;
        break;
      case 'accessActivities3':
        this.accessActivitiesVisible3 = !this.accessActivitiesVisible3;
        break;
      case 'kgActivities1':
        this.kgActivitiesVisible1 = !this.kgActivitiesVisible1;
        break;
      case 'kgActivities2':
        this.kgActivitiesVisible2 = !this.kgActivitiesVisible2;
        break;
      case 'kgActivities3':
        this.kgActivitiesVisible3 = !this.kgActivitiesVisible3;
        break;
      case 'recommendationActivities1':
        this.recommendationActivitiesVisible1 = !this.recommendationActivitiesVisible1;
        break;
      case 'recommendationActivities2':
        this.recommendationActivitiesVisible2 = !this.recommendationActivitiesVisible2;
        break;
      case 'recommendationActivities3':
        this.recommendationActivitiesVisible3 = !this.recommendationActivitiesVisible3;
        break;
    }
  }

  getHiddenChartsCount(): number {
    let count = 0;
    if (!this.addedAnnotationsVisible) count++;
    if (!this.annotationInteractionsVisible) count++;
    if (!this.likesDislikesVisible) count++;
    if (!this.tagsVisible) count++;
    if (!this.pdfActivitiesVisible) count++;
    if (!this.videoActivitiesVisible) count++;
    if (!this.slidesAndVideoTimeVisible) count++;
    if (!this.accessActivitiesVisible1) count++;
    if (!this.accessActivitiesVisible2) count++;
    if (!this.accessActivitiesVisible3) count++;
    if (!this.kgActivitiesVisible1) count++;
    if (!this.kgActivitiesVisible2) count++;
    if (!this.kgActivitiesVisible3) count++;
    if (!this.recommendationActivitiesVisible1) count++;
    if (!this.recommendationActivitiesVisible2) count++;
    if (!this.recommendationActivitiesVisible3) count++;
    return count;
  }

  showAllCharts(): void {
    this.addedAnnotationsVisible = true;
    this.annotationInteractionsVisible = true;
    this.likesDislikesVisible = true;
    this.tagsVisible = true;
    this.pdfActivitiesVisible = true;
    this.videoActivitiesVisible = true;
    this.slidesAndVideoTimeVisible = true;
    this.accessActivitiesVisible1 = true;
    this.accessActivitiesVisible2 = true;
    this.accessActivitiesVisible3 = true;
    this.kgActivitiesVisible1 = true;
    this.kgActivitiesVisible2 = true;
    this.kgActivitiesVisible3 = true;
    this.recommendationActivitiesVisible1 = true;
    this.recommendationActivitiesVisible2 = true;
    this.recommendationActivitiesVisible3 = true;
  }

  openAnnotationFilter(event: Event): void {
    this.annotationFilterPanel.toggle(event);
  }

  openMaterialFilter(event: Event): void {
    this.materialFilterPanel.toggle(event);
  }

  openAccessFilter(event: Event): void {
    this.accessFilterPanel.toggle(event);
  }

  openKgFilter(event: Event): void {
    this.kgFilterPanel.toggle(event);
  }

  openRecommendationFilter(event: Event): void {
    this.recommendationFilterPanel.toggle(event);
  }

  maximizeChart(chartName: string): void {
    this.maximizedChart = chartName;
    switch(chartName) {
      case 'addedAnnotations':
        this.maximizedChartData = this.addedAnnotationsData;
        this.maximizedChartOptions = this.addedAnnotationsOptions;
        this.maximizedChartTitle = 'Added annotations';
        this.maximizedChartMaterialList = [];
        break;
      case 'annotationInteractions':
        this.maximizedChartData = this.annotationInteractionsData;
        this.maximizedChartOptions = this.annotationInteractionsOptions;
        this.maximizedChartTitle = 'Total annotation interactions';
        this.maximizedChartMaterialList = [];
        break;
      case 'likesDislikes':
        this.maximizedChartData = this.likesDislikesData;
        this.maximizedChartOptions = this.likesDislikesOptions;
        this.maximizedChartTitle = 'Total number of likes/dislikes on annotations';
        this.maximizedChartMaterialList = [];
        break;
      case 'tags':
        this.maximizedChartData = this.tagsData;
        this.maximizedChartOptions = this.tagsOptions;
        this.maximizedChartTitle = 'Total tags added/viewed';
        this.maximizedChartMaterialList = [];
        break;
      case 'pdfActivities':
        this.maximizedChartData = this.pdfActivitiesData;
        this.maximizedChartOptions = this.pdfActivitiesOptions;
        this.maximizedChartTitle = 'PDF related activities';
        this.maximizedChartMaterialList = this.getPdfMaterialList();
        break;
      case 'videoActivities':
        this.maximizedChartData = this.videoActivitiesData;
        this.maximizedChartOptions = this.videoActivitiesOptions;
        this.maximizedChartTitle = 'Video related activities';
        this.maximizedChartMaterialList = this.getVideoMaterialList();
        break;
      case 'slidesAndVideoTime':
        this.maximizedChartData = this.slidesAndVideoTimeData;
        this.maximizedChartOptions = this.slidesAndVideoTimeOptions;
        this.maximizedChartTitle = 'Total slides viewed and time spent on videos';
        this.maximizedChartMaterialList = [];
        break;
      case 'accessActivities1':
        this.maximizedChartData = this.getChartData('accessActivities1');
        this.maximizedChartOptions = this.getChartOptions('accessActivities1');
        this.maximizedChartTitle = 'Access Activities by Type';
        this.maximizedChartMaterialList = [];
        break;
      case 'accessActivities2':
        this.maximizedChartData = this.getChartData('accessActivities2');
        this.maximizedChartOptions = this.getChartOptions('accessActivities2');
        this.maximizedChartTitle = 'Material Access Activities';
        this.maximizedChartMaterialList = [];
        break;
      case 'accessActivities3':
        this.maximizedChartData = this.getChartData('accessActivities3');
        this.maximizedChartOptions = this.getChartOptions('accessActivities3');
        this.maximizedChartTitle = 'Dashboard Access Activities';
        this.maximizedChartMaterialList = [];
        break;
      case 'kgActivities1':
        this.maximizedChartData = this.getChartData('kgActivities1');
        this.maximizedChartOptions = this.getChartOptions('kgActivities1');
        this.maximizedChartTitle = 'Knowledge Graph Access & Views';
        this.maximizedChartMaterialList = [];
        break;
      case 'kgActivities2':
        this.maximizedChartData = this.getChartData('kgActivities2');
        this.maximizedChartOptions = this.getChartOptions('kgActivities2');
        this.maximizedChartTitle = 'Knowledge Graph Marked Activities';
        this.maximizedChartMaterialList = [];
        break;
      case 'kgActivities3':
        this.maximizedChartData = this.getChartData('kgActivities3');
        this.maximizedChartOptions = this.getChartOptions('kgActivities3');
        this.maximizedChartTitle = 'Knowledge Graph Summary';
        this.maximizedChartMaterialList = [];
        break;
      case 'recommendationActivities1':
        this.maximizedChartData = this.getChartData('recommendationActivities1');
        this.maximizedChartOptions = this.getChartOptions('recommendationActivities1');
        this.maximizedChartTitle = 'Recommended Concepts Viewed';
        this.maximizedChartMaterialList = [];
        break;
      case 'recommendationActivities2':
        this.maximizedChartData = this.getChartData('recommendationActivities2');
        this.maximizedChartOptions = this.getChartOptions('recommendationActivities2');
        this.maximizedChartTitle = 'Recommended Materials';
        this.maximizedChartMaterialList = [];
        break;
      case 'recommendationActivities3':
        this.maximizedChartData = this.getChartData('recommendationActivities3');
        this.maximizedChartOptions = this.getChartOptions('recommendationActivities3');
        this.maximizedChartTitle = 'Recommended Concepts Marked';
        this.maximizedChartMaterialList = [];
        break;
    }
    this.showMaximizedDialog = true;
  }

  closeMaximizedChart(): void {
    this.showMaximizedDialog = false;
    this.maximizedChart = null;
    this.maximizedChartData = null;
    this.maximizedChartOptions = null;
    this.maximizedChartTitle = '';
    this.maximizedChartMaterialList = [];
  }

  getPdfMaterialList(): any[] {
    if (!this.engagementMetrics?.materialDetails?.pdfs) {
      return [];
    }
    const pdfs = this.engagementMetrics.materialDetails.pdfs;
    return [
      {
        label: 'PDFs Started',
        items: pdfs.started || []
      },
      {
        label: 'PDFs Completed',
        items: pdfs.completed || []
      }
    ];
  }

  getVideoMaterialList(): any[] {
    if (!this.engagementMetrics?.materialDetails?.videos) {
      return [];
    }
    const videos = this.engagementMetrics.materialDetails.videos;
    return [
      {
        label: 'Videos Started',
        items: videos.started || []
      },
      {
        label: 'Videos Completed',
        items: videos.completed || []
      }
    ];
  }

  navigateToMaterial(material: MaterialDetail): void {
    if (material.type === 'pdf') {
      this.router.navigate([
        'course',
        material.courseId,
        'channel',
        material.channelId,
        'material',
        { outlets: { material: [material.id, 'pdf'] } }
      ]);
    } else if (material.type === 'video') {
      this.router.navigate([
        'course',
        material.courseId,
        'channel',
        material.channelId,
        'material',
        { outlets: { material: [material.id, 'video'] } }
      ]);
    }
  }

  toggleChartType(chartName: string): void {
    this.chartTypes[chartName] = this.chartTypes[chartName] === 'bar' ? 'pie' : 'bar';
  }

  getChartType(chartName: string): 'bar' | 'pie' {
    return this.chartTypes[chartName] || 'bar';
  }

  getChartData(chartName: string): any {
    const chartType = this.getChartType(chartName);
    if (chartType === 'pie') {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsPieData;
        case 'annotationInteractions': return this.annotationInteractionsPieData;
        case 'likesDislikes': return this.likesDislikesPieData;
        case 'tags': return this.tagsPieData;
        case 'pdfActivities': return this.pdfActivitiesPieData;
        case 'videoActivities': return this.videoActivitiesPieData;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimePieData;
        case 'accessActivities1': return this.accessActivitiesPieData1;
        case 'accessActivities2': return this.accessActivitiesPieData2;
        case 'accessActivities3': return this.accessActivitiesPieData3;
        case 'kgActivities1': return this.kgActivitiesPieData1;
        case 'kgActivities2': return this.kgActivitiesPieData2;
        case 'kgActivities3': return this.kgActivitiesPieData3;
        case 'recommendationActivities1': return this.recommendationActivitiesPieData1;
        case 'recommendationActivities2': return this.recommendationActivitiesPieData2;
        case 'recommendationActivities3': return this.recommendationActivitiesPieData3;
        default: return null;
      }
    } else {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsData;
        case 'annotationInteractions': return this.annotationInteractionsData;
        case 'likesDislikes': return this.likesDislikesData;
        case 'tags': return this.tagsData;
        case 'pdfActivities': return this.pdfActivitiesData;
        case 'videoActivities': return this.videoActivitiesData;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeData;
        case 'accessActivities1': return this.accessActivitiesData1;
        case 'accessActivities2': return this.accessActivitiesData2;
        case 'accessActivities3': return this.accessActivitiesData3;
        case 'kgActivities1': return this.kgActivitiesData1;
        case 'kgActivities2': return this.kgActivitiesData2;
        case 'kgActivities3': return this.kgActivitiesData3;
        case 'recommendationActivities1': return this.recommendationActivitiesData1;
        case 'recommendationActivities2': return this.recommendationActivitiesData2;
        case 'recommendationActivities3': return this.recommendationActivitiesData3;
        default: return null;
      }
    }
  }

  getChartOptions(chartName: string): any {
    const chartType = this.getChartType(chartName);
    if (chartType === 'pie') {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsPieOptions;
        case 'annotationInteractions': return this.annotationInteractionsPieOptions;
        case 'likesDislikes': return this.likesDislikesPieOptions;
        case 'tags': return this.tagsPieOptions;
        case 'pdfActivities': return this.pdfActivitiesPieOptions;
        case 'videoActivities': return this.videoActivitiesPieOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimePieOptions;
        case 'accessActivities1': return this.accessActivitiesPieOptions1;
        case 'accessActivities2': return this.accessActivitiesPieOptions2;
        case 'accessActivities3': return this.accessActivitiesPieOptions3;
        case 'kgActivities1': return this.kgActivitiesPieOptions1;
        case 'kgActivities2': return this.kgActivitiesPieOptions2;
        case 'kgActivities3': return this.kgActivitiesPieOptions3;
        case 'recommendationActivities1': return this.recommendationActivitiesPieOptions1;
        case 'recommendationActivities2': return this.recommendationActivitiesPieOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesPieOptions3;
        default: return null;
      }
    } else {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsOptions;
        case 'annotationInteractions': return this.annotationInteractionsOptions;
        case 'likesDislikes': return this.likesDislikesOptions;
        case 'tags': return this.tagsOptions;
        case 'pdfActivities': return this.pdfActivitiesOptions;
        case 'videoActivities': return this.videoActivitiesOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeOptions;
        case 'accessActivities1': return this.accessActivitiesOptions1;
        case 'accessActivities2': return this.accessActivitiesOptions2;
        case 'accessActivities3': return this.accessActivitiesOptions3;
        case 'kgActivities1': return this.kgActivitiesOptions1;
        case 'kgActivities2': return this.kgActivitiesOptions2;
        case 'kgActivities3': return this.kgActivitiesOptions3;
        case 'recommendationActivities1': return this.recommendationActivitiesOptions1;
        case 'recommendationActivities2': return this.recommendationActivitiesOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesOptions3;
        default: return null;
      }
    }
  }

  // Chart type state (bar or pie) for each chart
  chartTypes: { [key: string]: 'bar' | 'pie' } = {
    addedAnnotations: 'bar',
    annotationInteractions: 'bar',
    likesDislikes: 'bar',
    tags: 'bar',
    pdfActivities: 'bar',
    videoActivities: 'bar',
    slidesAndVideoTime: 'bar',
    accessActivities1: 'bar',
    accessActivities2: 'bar',
    accessActivities3: 'bar',
    kgActivities1: 'bar',
    kgActivities2: 'bar',
    kgActivities3: 'bar',
    recommendationActivities1: 'bar',
    recommendationActivities2: 'bar',
    recommendationActivities3: 'bar'
  };

  // Chart data for Annotation Activities
  likesDislikesData: any;
  likesDislikesOptions: any;
  likesDislikesPieData: any;
  likesDislikesPieOptions: any;

  addedAnnotationsData: any;
  addedAnnotationsOptions: any;
  addedAnnotationsPieData: any;
  addedAnnotationsPieOptions: any;

  annotationInteractionsData: any;
  annotationInteractionsOptions: any;
  annotationInteractionsPieData: any;
  annotationInteractionsPieOptions: any;

  tagsData: any;
  tagsOptions: any;
  tagsPieData: any;
  tagsPieOptions: any;

  // Chart data for Material Activities
  pdfActivitiesData: any;
  pdfActivitiesOptions: any;
  pdfActivitiesPieData: any;
  pdfActivitiesPieOptions: any;

  videoActivitiesData: any;
  videoActivitiesOptions: any;
  videoActivitiesPieData: any;
  videoActivitiesPieOptions: any;

  slidesAndVideoTimeData: any;
  slidesAndVideoTimeOptions: any;
  slidesAndVideoTimePieData: any;
  slidesAndVideoTimePieOptions: any;

  // Chart data for Access Activities
  accessActivitiesData1: any;
  accessActivitiesOptions1: any;
  accessActivitiesPieData1: any;
  accessActivitiesPieOptions1: any;
  accessActivitiesData2: any;
  accessActivitiesOptions2: any;
  accessActivitiesPieData2: any;
  accessActivitiesPieOptions2: any;
  accessActivitiesData3: any;
  accessActivitiesOptions3: any;
  accessActivitiesPieData3: any;
  accessActivitiesPieOptions3: any;

  // Chart data for KG Activities
  kgActivitiesData1: any;
  kgActivitiesOptions1: any;
  kgActivitiesPieData1: any;
  kgActivitiesPieOptions1: any;
  kgActivitiesData2: any;
  kgActivitiesOptions2: any;
  kgActivitiesPieData2: any;
  kgActivitiesPieOptions2: any;
  kgActivitiesData3: any;
  kgActivitiesOptions3: any;
  kgActivitiesPieData3: any;
  kgActivitiesPieOptions3: any;

  // Chart data for Recommendation Activities
  recommendationActivitiesData1: any;
  recommendationActivitiesOptions1: any;
  recommendationActivitiesPieData1: any;
  recommendationActivitiesPieOptions1: any;
  recommendationActivitiesData2: any;
  recommendationActivitiesOptions2: any;
  recommendationActivitiesPieData2: any;
  recommendationActivitiesPieOptions2: any;
  recommendationActivitiesData3: any;
  recommendationActivitiesOptions3: any;
  recommendationActivitiesPieData3: any;
  recommendationActivitiesPieOptions3: any;

  // Gauge chart data
  gaugeData: any;
  gaugeOptions: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeCharts();
    this.initializePieCharts();
    this.initializeGauge();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['engagementMetrics'] && this.engagementMetrics) {
      // Ensure pie charts are initialized before updating data
      if (!this.addedAnnotationsPieData) {
        this.initializePieCharts();
      }
      this.updateChartsWithData();
    }
    if (changes['engagementLevel']) {
      this.initializeGauge();
    }
  }

  private updateChartsWithData(): void {
    if (!this.engagementMetrics || !this.engagementMetrics.metrics) {
      return;
    }

    // Ensure pie charts are initialized before updating
    if (!this.addedAnnotationsPieData) {
      this.initializePieCharts();
    }

    const metrics = this.engagementMetrics.metrics;

    // Update annotation charts
    this.updateAnnotationCharts(metrics);
    
    // Update material charts
    this.updateMaterialCharts(metrics);
    
    // Update access, KG, and recommendation charts
    this.updateAccessCharts(metrics);
    this.updateKgCharts(metrics);
    this.updateRecommendationCharts(metrics);
  }

  private updateAnnotationCharts(metrics: any): void {
    // Update Added Annotations chart
    if (this.addedAnnotationsData) {
      const data = [
        metrics.annotations.question || 0,
        metrics.annotations.note || 0,
        metrics.annotations.externalResource || 0
      ];
      this.addedAnnotationsData = {
        ...this.addedAnnotationsData,
        datasets: [{
          ...this.addedAnnotationsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.addedAnnotationsPieData = {
        labels: this.addedAnnotationsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#a855f7', '#9333ea', '#7e22ce'] // Different shades of purple
        }]
      };
    }

    // Update Annotation Interactions chart
    if (this.annotationInteractionsData) {
      const data = [
        metrics.totalAnnotationsFollowed || 0,
        metrics.totalUserMentionedRepliedActivities || 0,
        metrics.totalAnnotationsReplied || 0
      ];
      this.annotationInteractionsData = {
        ...this.annotationInteractionsData,
        datasets: [{
          ...this.annotationInteractionsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.annotationInteractionsPieData = {
        labels: this.annotationInteractionsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#22c55e', '#16a34a', '#15803d'] // Different shades of green
        }]
      };
    }

    // Update Likes/Dislikes chart
    if (this.likesDislikesData) {
      const likesData = [
        metrics.likes.question || 0,
        metrics.likes.note || 0,
        metrics.likes.externalResource || 0
      ];
      const dislikesData = [
        metrics.dislikes.question || 0,
        metrics.dislikes.note || 0,
        metrics.dislikes.externalResource || 0
      ];
      this.likesDislikesData = {
        ...this.likesDislikesData,
        datasets: [
          {
            ...this.likesDislikesData.datasets[0],
            data: likesData
          },
          {
            ...this.likesDislikesData.datasets[1],
            data: dislikesData
          }
        ]
      };
      // Update pie chart data (show likes and dislikes separately) - always update if bar chart exists
      const allData = [...likesData, ...dislikesData];
      this.likesDislikesPieData = {
        labels: [
          'Likes - Question', 'Likes - Note', 'Likes - External Resource',
          'Dislikes - Question', 'Dislikes - Note', 'Dislikes - External Resource'
        ],
        datasets: [{
          data: allData,
          backgroundColor: [
            '#3b82f6', '#3b82f6', '#3b82f6', // blue for likes
            '#f97316', '#f97316', '#f97316'  // orange for dislikes
          ]
        }]
      };
    }

    // Update Tags chart
    if (this.tagsData) {
      const data = [
        metrics.totalAddedTags || 0,
        metrics.totalTagViewed || 0
      ];
      this.tagsData = {
        ...this.tagsData,
        datasets: [{
          ...this.tagsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.tagsPieData = {
        labels: this.tagsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#3b82f6', '#2563eb'] // Different shades of blue
        }]
      };
    }
  }

  private updateMaterialCharts(metrics: any): void {
    // Update PDF Activities chart
    if (this.pdfActivitiesData) {
      const data = [
        metrics.pdfStarted || 0,
        metrics.pdfCompleted || 0
      ];
      this.pdfActivitiesData = {
        ...this.pdfActivitiesData,
        datasets: [{
          ...this.pdfActivitiesData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.pdfActivitiesPieData = {
        labels: this.pdfActivitiesData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#6b7280', '#4b5563'] // Different shades of gray
        }]
      };
    }

    // Update Video Activities chart
    if (this.videoActivitiesData) {
      const data = [
        metrics.videosStarted || 0,
        metrics.videosCompleted || 0
      ];
      this.videoActivitiesData = {
        ...this.videoActivitiesData,
        datasets: [{
          ...this.videoActivitiesData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.videoActivitiesPieData = {
        labels: this.videoActivitiesData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#f97316', '#ea580c'] // Different shades of orange
        }]
      };
    }

    // Update Slides and Video Time chart
    if (this.slidesAndVideoTimeData) {
      // Convert time spent on videos from seconds to minutes for display
      const timeSpentInMinutes = Math.round((metrics.timeSpentOnVideos || 0) / 60);
      const data = [
        metrics.slidesViewed || 0,
        timeSpentInMinutes
      ];
      this.slidesAndVideoTimeData = {
        ...this.slidesAndVideoTimeData,
        datasets: [{
          ...this.slidesAndVideoTimeData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.slidesAndVideoTimePieData = {
        labels: this.slidesAndVideoTimeData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#8b5cf6', '#7c3aed'] // Different shades of purple
        }]
      };
    }
  }

  private updateAccessCharts(metrics: any): void {
    // Update Access Activities chart 1
    if (this.accessActivitiesData1) {
      const data = [
        metrics.courseAccesses || 0,
        metrics.topicAccesses || 0,
        metrics.channelAccesses || 0,
        metrics.materialAccesses || 0
      ];
      this.accessActivitiesData1 = {
        ...this.accessActivitiesData1,
        datasets: [{
          ...this.accessActivitiesData1.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.accessActivitiesPieData1 = {
        labels: this.accessActivitiesData1.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#10b981', '#059669', '#047857', '#065f46']
        }]
      };
    }

    // Update Access Activities chart 2
    if (this.accessActivitiesData2) {
      const data = [
        metrics.pdfAccess || 0,
        metrics.videoAccess || 0
      ];
      this.accessActivitiesData2 = {
        ...this.accessActivitiesData2,
        datasets: [{
          ...this.accessActivitiesData2.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.accessActivitiesPieData2 = {
        labels: this.accessActivitiesData2.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#06b6d4', '#0891b2']
        }]
      };
    }

    // Update Access Activities chart 3
    if (this.accessActivitiesData3) {
      const data = [
        metrics.dashboardCourseAccesses || 0,
        metrics.dashboardTopicAccesses || 0,
        metrics.dashboardChannelAccesses || 0,
        metrics.dashboardMaterialAccesses || 0
      ];
      this.accessActivitiesData3 = {
        ...this.accessActivitiesData3,
        datasets: [{
          ...this.accessActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.accessActivitiesPieData3 = {
        labels: this.accessActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#84cc16', '#65a30d', '#4d7c0f', '#365314']
        }]
      };
    }
  }

  private updateKgCharts(metrics: any): void {
    // Update KG Activities chart 1
    if (this.kgActivitiesData1) {
      const data = [
        metrics.totalKnowledgeGraphAccesses || 0,
        metrics.totalKnowledgeGraphConceptViewed || 0
      ];
      this.kgActivitiesData1 = {
        ...this.kgActivitiesData1,
        datasets: [{
          ...this.kgActivitiesData1.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData1 = {
        labels: this.kgActivitiesData1.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#8b5cf6', '#7c3aed']
        }]
      };
    }

    // Update KG Activities chart 2
    if (this.kgActivitiesData2) {
      const data = [
        metrics.totalSlideKnowledgeGraphMarkedUnderstood || 0,
        metrics.totalSlideKnowledgeGraphMarkedNotUnderstood || 0,
        metrics.totalSlideKnowledgeGraphMarkedAsNew || 0
      ];
      this.kgActivitiesData2 = {
        ...this.kgActivitiesData2,
        datasets: [{
          ...this.kgActivitiesData2.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData2 = {
        labels: this.kgActivitiesData2.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#ec4899', '#db2777', '#be185d']
        }]
      };
    }

    // Update KG Activities chart 3
    if (this.kgActivitiesData3) {
      const data = [
        metrics.totalKnowledgeGraphAccesses || 0,
        metrics.totalKnowledgeGraphConceptViewed || 0
      ];
      this.kgActivitiesData3 = {
        ...this.kgActivitiesData3,
        datasets: [{
          ...this.kgActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData3 = {
        labels: this.kgActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#f59e0b', '#d97706']
        }]
      };
    }
  }

  private updateRecommendationCharts(metrics: any): void {
    // Update Recommendation Activities chart 1
    if (this.recommendationActivitiesData1) {
      const data = [
        metrics.totalRecommendedConceptViewed || 0,
        metrics.totalRecommendedConceptViewedVisualExplanation || 0,
        metrics.totalRecommendedConceptViewedTextualExplanation || 0
      ];
      this.recommendationActivitiesData1 = {
        ...this.recommendationActivitiesData1,
        datasets: [{
          ...this.recommendationActivitiesData1.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.recommendationActivitiesPieData1 = {
        labels: this.recommendationActivitiesData1.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#6366f1', '#4f46e5', '#4338ca']
        }]
      };
    }

    // Update Recommendation Activities chart 2
    if (this.recommendationActivitiesData2) {
      const data = [
        metrics.totalRecommendedMaterialViewed || 0,
        metrics.totalRecommendedMaterialMarkedHelpful || 0,
        metrics.totalRecommendedMaterialMarkedNotHelpful || 0
      ];
      this.recommendationActivitiesData2 = {
        ...this.recommendationActivitiesData2,
        datasets: [{
          ...this.recommendationActivitiesData2.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.recommendationActivitiesPieData2 = {
        labels: this.recommendationActivitiesData2.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#14b8a6', '#0d9488', '#0f766e']
        }]
      };
    }

    // Update Recommendation Activities chart 3
    if (this.recommendationActivitiesData3) {
      const data = [
        metrics.recommendedConceptsMarkedUnderstood || 0,
        metrics.recommendedConceptsMarkedNotUnderstood || 0,
        metrics.recommendedConceptsMarkedAsNew || 0
      ];
      this.recommendationActivitiesData3 = {
        ...this.recommendationActivitiesData3,
        datasets: [{
          ...this.recommendationActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.recommendationActivitiesPieData3 = {
        labels: this.recommendationActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#ef4444', '#dc2626', '#b91c1c']
        }]
      };
    }
  }

  getEngagementColor(): string {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return 'text-red-600';
    } else if (level === 'medium') {
      return 'text-yellow-600';
    } else if (level === 'high') {
      return 'text-green-600';
    }
    return 'text-gray-600';
  }

  getEngagementValue(): number {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return 33;
    } else if (level === 'medium') {
      return 66;
    } else if (level === 'high') {
      return 100;
    }
    return 0;
  }

  getGaugeColor(): string {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return '#ef4444'; // red
    } else if (level === 'medium') {
      return '#eab308'; // yellow
    } else if (level === 'high') {
      return '#22c55e'; // green
    }
    return '#6b7280'; // gray
  }

  private initializeGauge(): void {
    const value = this.getEngagementValue();
    const color = this.getGaugeColor();
    
    this.gaugeData = {
      labels: ['Engagement Level'],
      datasets: [
        {
          data: [value, 100 - value],
          backgroundColor: [color, '#e5e7eb'],
          borderWidth: 0
        }
      ]
    };

    this.gaugeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      rotation: -90,
      circumference: 180
    };
  }

  private initializeCharts(): void {
    // Total number of likes/dislikes on annotations chart
    this.likesDislikesData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [
        {
          label: 'Likes',
          backgroundColor: '#3b82f6', // blue
          data: [0, 0, 0]
        },
        {
          label: 'Dislikes',
          backgroundColor: '#f97316', // orange
          data: [0, 0, 0]
        }
      ]
    };
    this.likesDislikesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Total number of likes/dislikes on annotations'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Added annotations chart
    this.addedAnnotationsData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [
        {
          label: 'Added Annotations',
          backgroundColor: '#a855f7', // purple
          data: [0, 0, 0]
        }
      ]
    };
    this.addedAnnotationsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Added annotations'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Total annotation interactions chart
    this.annotationInteractionsData = {
      labels: ['Annotations followed', 'Annotations mentioned', 'Annotations replied'],
      datasets: [
        {
          label: 'Interactions',
          backgroundColor: '#22c55e', // green
          data: [0, 0, 0]
        }
      ]
    };
    this.annotationInteractionsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total annotation interactions'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Total tags added/viewed chart
    this.tagsData = {
      labels: ['Tags added', 'Tags viewed'],
      datasets: [
        {
          label: 'Tag Activity',
          backgroundColor: '#3b82f6', // blue
          data: [0, 0]
        }
      ]
    };
    this.tagsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total tags added/viewed'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // PDF related activities chart
    this.pdfActivitiesData = {
      labels: ['PDFs started', 'PDFs completed'],
      datasets: [
        {
          label: 'PDF Activities',
          backgroundColor: '#6b7280', // dark grey
          data: [0, 0]
        }
      ]
    };
    this.pdfActivitiesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'PDF related activities'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Video related activities chart
    this.videoActivitiesData = {
      labels: ['Videos played', 'Videos completed'],
      datasets: [
        {
          label: 'Video Activities',
          backgroundColor: '#f97316', // orange
          data: [0, 0]
        }
      ]
    };

    // Combined slides viewed and video time chart
    this.slidesAndVideoTimeData = {
      labels: ['Total slides viewed', 'Time spent on videos'],
      datasets: [
        {
          label: 'Material Engagement',
          backgroundColor: '#8b5cf6', // purple
          data: [0, 0]
        }
      ]
    };
    this.slidesAndVideoTimeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total slides viewed and time spent on videos'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };
    this.videoActivitiesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Video related activities'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Initialize Access Activities charts
    this.accessActivitiesData1 = {
      labels: ['Course', 'Topic', 'Channel', 'Material'],
      datasets: [{
        label: 'Access Activities',
        backgroundColor: '#10b981', // green
        data: [0, 0, 0, 0]
      }]
    };
    this.accessActivitiesOptions1 = this.createDefaultChartOptions('Access Activities by Type');

    this.accessActivitiesData2 = {
      labels: ['PDF Access', 'Video Access'],
      datasets: [{
        label: 'Material Access',
        backgroundColor: '#06b6d4', // cyan
        data: [0, 0]
      }]
    };
    this.accessActivitiesOptions2 = this.createDefaultChartOptions('Material Access Activities');

    this.accessActivitiesData3 = {
      labels: ['Course', 'Topic', 'Channel', 'Material'],
      datasets: [{
        label: 'Dashboard Access',
        backgroundColor: '#84cc16', // lime
        data: [0, 0, 0, 0]
      }]
    };
    this.accessActivitiesOptions3 = this.createDefaultChartOptions('Dashboard Access Activities');

    // Initialize KG Activities charts
    this.kgActivitiesData1 = {
      labels: ['KG Accesses', 'Concepts Viewed'],
      datasets: [{
        label: 'KG Activities',
        backgroundColor: '#8b5cf6', // purple
        data: [0, 0]
      }]
    };
    this.kgActivitiesOptions1 = this.createDefaultChartOptions('Knowledge Graph Access & Views');

    this.kgActivitiesData2 = {
      labels: ['Marked Understood', 'Marked Not Understood', 'Marked as New'],
      datasets: [{
        label: 'KG Marked Activities',
        backgroundColor: '#ec4899', // pink
        data: [0, 0, 0]
      }]
    };
    this.kgActivitiesOptions2 = this.createDefaultChartOptions('Knowledge Graph Marked Activities');

    this.kgActivitiesData3 = {
      labels: ['Total KG Accesses', 'Concepts/Wiki Viewed'],
      datasets: [{
        label: 'KG Summary',
        backgroundColor: '#f59e0b', // amber
        data: [0, 0]
      }]
    };
    this.kgActivitiesOptions3 = this.createDefaultChartOptions('Knowledge Graph Summary');

    // Initialize Recommendation Activities charts
    this.recommendationActivitiesData1 = {
      labels: ['Concepts Viewed', 'Visual Explanations', 'Textual Explanations'],
      datasets: [{
        label: 'Recommendation Views',
        backgroundColor: '#6366f1', // indigo
        data: [0, 0, 0]
      }]
    };
    this.recommendationActivitiesOptions1 = this.createDefaultChartOptions('Recommended Concepts Viewed');

    this.recommendationActivitiesData2 = {
      labels: ['Materials Viewed', 'Marked Helpful', 'Marked Not Helpful'],
      datasets: [{
        label: 'Recommendation Materials',
        backgroundColor: '#14b8a6', // teal
        data: [0, 0, 0]
      }]
    };
    this.recommendationActivitiesOptions2 = this.createDefaultChartOptions('Recommended Materials');

    this.recommendationActivitiesData3 = {
      labels: ['Marked Understood', 'Marked Not Understood', 'Marked as New'],
      datasets: [{
        label: 'Recommendation Marked',
        backgroundColor: '#ef4444', // red
        data: [0, 0, 0]
      }]
    };
    this.recommendationActivitiesOptions3 = this.createDefaultChartOptions('Recommended Concepts Marked');
  }

  private createDefaultChartOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: title
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };
  }

  private createPieChartOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: true,
          text: title
        }
      }
    };
  }

  private initializePieCharts(): void {
    // Initialize pie charts for all bar charts
    // Added Annotations pie chart
    this.addedAnnotationsPieData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#a855f7', '#9333ea', '#7e22ce'] // Different shades of purple
      }]
    };
    this.addedAnnotationsPieOptions = this.createPieChartOptions('Added annotations');

    // Annotation Interactions pie chart
    this.annotationInteractionsPieData = {
      labels: ['Annotations followed', 'Annotations mentioned', 'Annotations replied'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#22c55e', '#16a34a', '#15803d'] // Different shades of green
      }]
    };
    this.annotationInteractionsPieOptions = this.createPieChartOptions('Total annotation interactions');

    // Likes/Dislikes pie chart
    this.likesDislikesPieData = {
      labels: [
        'Likes - Question', 'Likes - Note', 'Likes - External Resource',
        'Dislikes - Question', 'Dislikes - Note', 'Dislikes - External Resource'
      ],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#3b82f6', '#3b82f6', '#3b82f6', // blue for likes
          '#f97316', '#f97316', '#f97316'  // orange for dislikes
        ]
      }]
    };
    this.likesDislikesPieOptions = this.createPieChartOptions('Total number of likes/dislikes on annotations');

    // Tags pie chart
    this.tagsPieData = {
      labels: ['Tags added', 'Tags viewed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#3b82f6', '#2563eb'] // Different shades of blue
      }]
    };
    this.tagsPieOptions = this.createPieChartOptions('Total tags added/viewed');

    // PDF Activities pie chart
    this.pdfActivitiesPieData = {
      labels: ['PDFs started', 'PDFs completed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#6b7280', '#4b5563'] // Different shades of gray
      }]
    };
    this.pdfActivitiesPieOptions = this.createPieChartOptions('PDF related activities');

    // Video Activities pie chart
    this.videoActivitiesPieData = {
      labels: ['Videos played', 'Videos completed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#f97316', '#ea580c'] // Different shades of orange
      }]
    };
    this.videoActivitiesPieOptions = this.createPieChartOptions('Video related activities');

    // Slides and Video Time pie chart
    this.slidesAndVideoTimePieData = {
      labels: ['Total slides viewed', 'Time spent on videos'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#8b5cf6', '#7c3aed'] // Different shades of purple
      }]
    };
    this.slidesAndVideoTimePieOptions = this.createPieChartOptions('Total slides viewed and time spent on videos');
  }
}

