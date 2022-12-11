import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Material } from 'src/app/model/material';
import { MaterialsService } from 'src/app/services/materials.service';

@Component({
  selector: 'app-material-list',
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.css'],
})
export class MaterialListComponent implements OnInit {
  materials: Material[];
  courseId: string;
  channelId: string;
  highlightMaterials: string[] = [];

  constructor(
    private materialService: MaterialsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.materialService.selectedChannel$.subscribe((selectedChannel: any) => {
      if (!selectedChannel) return;
      this.router.navigate(['/home'], {
        queryParams: {
          courseId: selectedChannel.courseId,
          channelId: selectedChannel.channelId,
        },
      });
      (this.courseId = selectedChannel.courseId),
        (this.channelId = selectedChannel.channelId);
      this.getMaterials(this.courseId, this.channelId);
    });
    this.materialService.highlightMaterials$.subscribe((materials: []) => {
      this.highlightMaterials = materials;
    });
    this.route.queryParams.subscribe((params: any) => {
      if (!params) return;
      this.getMaterials(params.courseId, params.channelId);
    });
  }

  getMaterials(courseId: string, channelId: string) {
    this.materialService
      .getMaterials(courseId, channelId)
      .subscribe((res: any) => {
        this.materials = res.foundMaterials;
      });
  }

  onActiveMaterial(materialId: string, courseId: string) {
    const activeMaterial = {
      materialId: materialId,
      courseId: courseId,
    };
    this.materialService.activeMaterial.next(activeMaterial);
    // remove hight light style
    const index = this.highlightMaterials.indexOf(materialId);
    if (index > -1) {
      this.highlightMaterials.splice(index, 1);
    }
  }
}
