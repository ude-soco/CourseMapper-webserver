export interface Comment {
    _id: string;
    annotationID: string;
    userID: string;
    username: string;
    createdAt: number;
    updatedAt: number;
    content: string;
    likes: string[];
    dislikes: string[];
}

export interface CreateCommentDTO {
    content: string;
}

export interface UpdateCommentDTO {
    content: string;
}