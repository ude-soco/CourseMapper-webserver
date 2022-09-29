export interface Alert {
    type: AlertType;
    message: string;
}
export enum AlertType {
    Success,
    Error
}