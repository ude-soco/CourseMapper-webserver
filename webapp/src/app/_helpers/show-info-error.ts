import { MessageService } from "primeng/api";

export class ShowInfoError {
    constructor(private messageService: MessageService){
        
    }

    showInfo(msg) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: msg,
        });
      }
      showError(msg) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
        });
      }
}
