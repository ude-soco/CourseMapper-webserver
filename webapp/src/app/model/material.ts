import { NzStringTemplateOutletContext } from 'ng-zorro-antd/core/outlet/string_template_outlet.directive';

export interface Material {
  _id: string;
  type: string;
  name: string;
  description: string;
  url: string;
  topicId: string;
  courseId: string;
  channelId: string;
  userId: string;
  annotations: any;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveChannel {
  channelId: string;
  courseId: string;
}

export interface ActiveMaterial {
  materialId: string;
  courseId: string;
}
