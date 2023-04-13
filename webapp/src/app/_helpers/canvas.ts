import { Drawing } from "../models/Drawing";


export function paintDrawing(drawing: Drawing, ctx: CanvasRenderingContext2D, startX: number, videoBoundingRect: DOMRect) {
    ctx.lineWidth = drawing.width;
    ctx.strokeStyle = drawing.color;

    if (drawing.vertices.length < 2) return;

    switch (drawing.tool) {
        case "brush":
        {
            ctx.beginPath();
            
            const x0 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[0].xRatio + startX;
            const y0 = (videoBoundingRect?.height || 0) * drawing.vertices[0].yRatio;

            ctx.moveTo(x0, y0);

            for (let i = 1; i < drawing.vertices.length - 2; i++)
            {
            const x = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[i].xRatio + startX;
            const y = (videoBoundingRect?.height || 0) * drawing.vertices[i].yRatio;

            const x2 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[i + 1].xRatio + startX;
            const y2 = (videoBoundingRect?.height || 0) * drawing.vertices[i + 1].yRatio;

            var xc = (x * 5 + x2) / 6;
            var yc = (y * 5 + y2) / 6;
            ctx.quadraticCurveTo(x, y, xc, yc);
            }

            const x = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[drawing.vertices.length - 2].xRatio + startX;
            const y = (videoBoundingRect?.height || 0) * drawing.vertices[drawing.vertices.length - 2].yRatio;
            
            const x2 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[drawing.vertices.length - 1].xRatio + startX;
            const y2 = (videoBoundingRect?.height || 0) * drawing.vertices[drawing.vertices.length - 1].yRatio;

            ctx.quadraticCurveTo(x, y, x2, y2);

            ctx.stroke();
        }
        break;

        case "line":
        case "arrow":
        {
            const x = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[0].xRatio + startX;
            const y = (videoBoundingRect?.height || 0) * drawing.vertices[0].yRatio;

            const x2 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[1].xRatio + startX;
            const y2 = (videoBoundingRect?.height || 0) * drawing.vertices[1].yRatio;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);

            if (drawing.tool == "arrow") {
            const dx = x2 - x, dy = y2-y, dist = Math.sqrt(dx*dx + dy*dy);
            const vx = (x2 - x) / dist, vy = (y2 - y) / dist;
            const a1 = Math.PI / 3, a2 = - Math.PI / 3;

            const nx1 = (vx * Math.cos(a1)) - (vy * Math.sin(a1)) + vx;
            const ny1 = (vx * Math.sin(a1)) + (vy * Math.cos(a1)) + vy;

            const nx2 = (vx * Math.cos(a2)) - (vy * Math.sin(a2)) + vx;
            const ny2 = (vx * Math.sin(a2)) + (vy * Math.cos(a2)) + vy;

            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - nx1 * 20, y2 - ny1 * 20);
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - nx2 * 20, y2 - ny2 * 20);
            }

            ctx.stroke();
        }
        break;

        case "rectangle":
        {
            const x = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[0].xRatio + startX;
            const y = (videoBoundingRect?.height || 0) * drawing.vertices[0].yRatio;
            
            const x2 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[1].xRatio + startX;
            const y2 = (videoBoundingRect?.height || 0) * drawing.vertices[1].yRatio;

            ctx.strokeRect(x, y, x2 - x, y2 - y);
        }
        break;

        case "circle":
            {
            const x = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[0].xRatio + startX;
            const y = (videoBoundingRect?.height || 0) * drawing.vertices[0].yRatio;
            
            const x2 = ((videoBoundingRect?.width || 0) - startX * 2) * drawing.vertices[1].xRatio + startX;
            const y2 = (videoBoundingRect?.height || 0) * drawing.vertices[1].yRatio;

            const dx = x2 - x, dy = y2 - y;
            const radius = Math.sqrt(dx * dx + dy * dy);

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            }
            break;
    }
}

export function isPointInDrawing(pointXRatio: number, pointYRatio: number, drawing: Drawing, startX: number, videoBoundingRect: DOMRect) {
    if (drawing.vertices.length < 2) return false;

    if (drawing.tool == "circle") {
        const dx = drawing.vertices[0].xRatio - drawing.vertices[1].xRatio;
        const dy = drawing.vertices[0].yRatio - drawing.vertices[1].yRatio;
        const r2 = (dx * dx) + (dy * dy);
        
        const pdx = pointXRatio - drawing.vertices[0].xRatio;
        const pdy = pointYRatio - drawing.vertices[0].yRatio;
        const pr2 = (pdx * pdx) + (pdy * pdy);

        return pr2 <= r2;
    }

    const firstVertex = drawing.vertices[0];
    let beginX = firstVertex.xRatio, beginY = firstVertex.yRatio, endX = firstVertex.xRatio, endY = firstVertex.yRatio;

    for (let vertex of drawing.vertices) {
      if (vertex.xRatio < beginX) beginX = vertex.xRatio;
      if (vertex.yRatio < beginY) beginY = vertex.yRatio;
      if (vertex.xRatio > endX) endX = vertex.xRatio;
      if (vertex.yRatio > endY) endY = vertex.yRatio;
    }

    const dx = 5 / ((videoBoundingRect?.width || 0) - startX * 2);
    const dy = 5 / (videoBoundingRect?.height || 1);

    if (pointXRatio >= beginX - dx && pointXRatio <= endX + dx && pointYRatio >= beginY - dy && pointYRatio <= endY + dy) {
        return true;
    }

    return false;
}

export function paintPin(xRatio: number, yRatio: number, ctx: CanvasRenderingContext2D, startX: number, videoBoundingRect: DOMRect) {
    let p = new Path2D("M15 11.586V6h2V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2h2v5.586l-2.707 1.707A.996.996 0 0 0 6 14v2a1 1 0 0 0 1 1h4v3l1 2 1-2v-3h4a1 1 0 0 0 1-1v-2a.996.996 0 0 0-.293-.707L15 11.586z");
    const x = ((videoBoundingRect?.width || 0) - startX * 2) * xRatio + startX;
    const y = (videoBoundingRect?.height || 0) * yRatio;


    ctx.fillStyle = "#000";
    ctx.translate(xRatio - 18, yRatio - 24);
    ctx.scale(1.5, 1.3);
    ctx.fill(p);
    ctx.resetTransform();

    ctx.fillStyle = "#fff";
    ctx.translate(xRatio - 12, yRatio - 22);
    ctx.fill(p);
    ctx.resetTransform();

}

export function isPointInPin(pointXRatio: number, pointYRatio: number, xRatio: number, yRatio: number, startX: number, videoBoundingRect: DOMRect) {
    const x = ((videoBoundingRect?.width || 0) - startX * 2) * xRatio + startX;
    const y = (videoBoundingRect?.height || 0) * yRatio;


    const xa = ((videoBoundingRect?.width || 0) - startX * 2) * pointXRatio + startX;
    const ya = (videoBoundingRect?.height || 0) * pointYRatio;


    if (xa > xRatio - 18 && xa < xRatio + 18 && ya > yRatio - 24 && ya < yRatio) {
        return true;
    }
    return false;
}