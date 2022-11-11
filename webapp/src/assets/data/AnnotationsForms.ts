export interface Position {
  x: number;
  y: number;
}

export interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  borderRadius: number;
  lineHeight: number;
}

export interface RectangleObject {
  rectangleId: string;
  pageNumber: number;
  coordinates: Rectangle;
  isDelete?: boolean;
  type: string;
  lineHeight: number;
  _id: string;
}
