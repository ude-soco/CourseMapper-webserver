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
import { FormsModule } from '@angular/forms';
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
// boby024
// import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
// import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { CustomRecommendationOptionComponent } from './custom-recommendation-option/custom-recommendation-option.component';
import { ReactiveFormsModule } from '@angular/forms';
// import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ListboxModule } from 'primeng/listbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';


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
  ],
  imports: [
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
    MultiSelectModule
    ],
  exports: [
    ConceptMapComponent,
    CytoscapeComponent,
    CytoscapeRecommendedComponent,
    CytoscapeRoadsComponent,
    GraphComponent,
    GraphRecommednedComponent,
  ],
  
})
export class KnowledgeGraphModule {}
