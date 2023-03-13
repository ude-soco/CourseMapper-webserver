export function calculateMousePositionInVideo(mouseX: number, mouseY: number, boundingRect: DOMRect, videoWidth: number, videoHeight: number) {
    const actualHeight = Math.min(700, (boundingRect?.height || 0));
    const zoomRatio = (videoHeight || 0) / (actualHeight || 1);
    const actualWidth = (videoWidth || 0) / (zoomRatio || 1);

    // const startX = (boundingRect?.left || 0) + ((boundingRect?.width || 0) - (actualWidth || 0)) / 2;
    const startX = (boundingRect?.left || 0);
    const startY = (boundingRect?.top || 0);

    const isInsideVideo = mouseX > startX && mouseX < startX + (actualWidth || 0) &&
        mouseY > startY && mouseY < startY + (actualHeight || 0);

    if (isInsideVideo) {
        const xRatio = (mouseX - startX) / (actualWidth || 1);
        const yRatio = (mouseY - startY) / (actualHeight || 1);

        return {
            isInsideVideo: true,
            xRatio,
            yRatio,
            xPosition: mouseX - (boundingRect?.left || 0),
            yPosition: mouseY - (boundingRect?.top || 0)
        };
    }

    return {
        isInsideVideo: false,
        xRatio: 0,
        yRatio: 0,
        xPosition: 0,
        yPosition: 0
    };
}

export function calculatePositionFromRatios(xRatio: number, yRatio: number, boundingRect: DOMRect, videoWidth: number, videoHeight: number) {
    const actualHeight = Math.min(600, (boundingRect?.height || 0));
    const zoomRatio = (videoHeight || 0) / (actualHeight || 1);
    const actualWidth = (videoWidth || 0) / (zoomRatio || 1);

    const startX = ((boundingRect?.width || 0) - (actualWidth || 0)) / 2;

    const x = ((boundingRect?.width || 0) - startX * 2) * xRatio + startX;
    const y = (boundingRect?.height || 0) * yRatio;

    return { x, y };
}

export type VideoType = "video" | "vimeo" | "youtube";

export function detectVideoType(url: string): VideoType {
    if (url.includes("vimeo.com")) return "vimeo";
    if (url.includes("youtube.com")) return "youtube";
    return "video";
}