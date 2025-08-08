import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConceptMapComponent } from './concept-map/concept-map.component';
import { CytoscapeComponent } from './cytoscape/cytoscape.component';
import { CytoscapeRecommendedComponent } from './cytoscape-recommended/cytoscape-recommended.component';
import { CytoscapeRoadsComponent } from './cytoscape-roads/cytoscape-roads.component';
import { GraphComponent } from './graph/graph.component';
import { GraphRecommednedComponent } from './graph-recommedned/graph-recommedned.component';
// import { PrimengModule } from '../../../modules/primeng/primeng.module';
import {AccordionModule} from 'primeng/accordion';
import {MenuItem} from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TabMenuModule } from 'primeng/tabmenu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { SidebarModule } from 'primeng/sidebar';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { CytoscapeSlideComponent } from './cytoscape-slide/cytoscape-slide.component';
import { CytoscapeSlideKGComponent } from './cytoscape-slide-kg/cytoscape-slide-kg.component';
import {DividerModule} from 'primeng/divider';
import {RadioButtonModule} from 'primeng/radiobutton';
import { ResultViewComponent } from './result-view/result-view.component';
import { CardVideoComponent } from './videos/card-video/card-video.component';
import { CardVideoListComponent } from './videos/card-video-list/card-video-list.component';
import { WatchVideoComponent } from './videos/watch-video/watch-video.component';
import { CardArticleComponent } from './articles/card-article/card-article.component';
import { CardArticleListComponent } from './articles/card-article-list/card-article-list.component';
import { RatingComponent } from './rating/rating.component';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import { DateAgoPipe } from './videos/pipes/date-ago.pipe';
import { LinkifyPipe } from './videos/pipes/linkify.pipe';
import { SafeHtmlPipe } from './videos/pipes/safehtml.pipe';
import {TabViewModule} from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { CustomRecommendationOptionComponent } from './custom-recommendation-option/custom-recommendation-option.component';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ListboxModule } from 'primeng/listbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MultiSelectModule } from 'primeng/multiselect';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { HighlightPipe } from 'src/app/highlight.pipe';
import { WordCloudComponent } from './word-cloud/word-cloud.component';
import { KeyphrasePopupComponent } from './keyphrase-popup/keyphrase-popup.component';
import { StackedColumnComponentComponent } from './stacked-column-component/stacked-column-component.component';
import { ColoredBandComponent } from './colored-band/colored-band.component';



import { PaginatorModule } from 'primeng/paginator';



@NgModule({
  declarations: [
    ConceptMapComponent,
    CytoscapeComponent,
    CytoscapeRecommendedComponent,
    CytoscapeRoadsComponent,
    GraphComponent,
    GraphRecommednedComponent,
    CytoscapeSlideComponent,
    CytoscapeSlideKGComponent,
    ResultViewComponent,
    CardVideoComponent,
    CardVideoListComponent,
    WatchVideoComponent,
    CardArticleComponent,
    CardArticleListComponent,
    RatingComponent,
    DateAgoPipe,
    LinkifyPipe,
    SafeHtmlPipe,
    CustomRecommendationOptionComponent, 
    HighlightPipe, WordCloudComponent,
    WordCloudComponent,
    KeyphrasePopupComponent,
    StackedColumnComponentComponent,
    ColoredBandComponent
    
    ],
  imports: [
    InputTextModule,
    FormsModule,
    CommonModule,
    DialogModule,
    DropdownModule,
    CheckboxModule,
    TabMenuModule,
    ProgressSpinnerModule,
    ButtonModule,
    StyleClassModule,
    SidebarModule,
    ToastModule,
    BadgeModule,
    AccordionModule,
    MenuModule,
    DividerModule,
    RadioButtonModule,
    OverlayPanelModule,
    TabViewModule,
    
    // boby024
    RadioButtonModule,
    TooltipModule,
    CheckboxModule,
    SliderModule,
    FormsModule,
    DropdownModule,
    ReactiveFormsModule,
    PaginatorModule,
    PanelModule,
    ScrollPanelModule,
    ListboxModule,
    ProgressBarModule,
    InputTextModule,
    MultiSelectModule,
    CardModule,
    // ReactiveFormsModule,
    AutoCompleteModule,
    MultiSelectModule,
    PdfViewerModule,
    PaginatorModule
    ],
  exports: [
    ConceptMapComponent,
    CytoscapeComponent,
    CytoscapeRecommendedComponent,
    CytoscapeRoadsComponent,
    GraphComponent,
    GraphRecommednedComponent,
    HighlightPipe
  ],

})
export class KnowledgeGraphModule {}
