import { Annotation } from './Annotation';

export interface TagMaterialDescription {
    id: string;
    name: string;
    annotations?: Annotation[];
};

export interface TagChannelDesciption {
    name: string;
    materials: TagMaterialDescription[];
};

export interface TagLessonDescription {
    name: string;
    channels: TagChannelDesciption[];
};

export interface TagAnnotations {
    annotations: Annotation[];
    descriptions: TagLessonDescription[];
};