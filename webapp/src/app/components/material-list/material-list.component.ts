import { Component, OnInit } from '@angular/core';
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
  constructor(private materialService: MaterialsService) {}

  ngOnInit(): void {
    this.materialService.selectedChannel$.subscribe((selectedChannel: any) => {
      (this.courseId = selectedChannel.courseId),
        (this.channelId = selectedChannel.channelId);
      this.getMaterials(this.courseId, this.channelId);
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
  }
}
