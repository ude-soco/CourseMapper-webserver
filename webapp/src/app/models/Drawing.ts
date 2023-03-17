export interface DrawingData {
    drawings: Drawing[];
}

export interface Drawing {
    tool: DrawingTool;
    color: string;
    width: number;
    vertices: Vertex[];
}

export interface Vertex {
    xRatio: number;
    yRatio: number;
}

export type DrawingTool = "brush" | "line" | "rectangle" | "circle" | "arrow";