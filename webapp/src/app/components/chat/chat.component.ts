import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ChatGptService} from '../../services/chat-gpt.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatListContainer') list?: ElementRef<HTMLDivElement>;
  chatInputMessage = '';
  isTyping = false;
  human = {
    id: 1,
    profileImageUrl: 'https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517433_960_720.png'
  };

  bot = {
    id: 2,
    profileImageUrl: './assets/img/ChatGPT_logo.svg'
  };

  chatMessages: {
    user: any,
    message: string
  }[] = [
    {
      user: this.bot,
      message: 'Hey, This is your virtual assistant. How can I help you today ?'
    },
  ];

  messages: { content: string, sender: string }[] = [];
  input = '';
  visible = false;

  position: string;

  constructor(private chatService: ChatGptService, private sanitizer: DomSanitizer) {
    this.messages.push({
     content: 'Hey, This is your virtual assistant. How can I help you today ?', sender: 'bot'
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  scrollToBottom(): void {
    const maxScroll = this.list?.nativeElement.scrollHeight;
    this.list?.nativeElement.scrollTo({top: maxScroll, behavior: 'smooth'});
  }

  async sendMessage(): Promise<void> {
    // const userMessage = this.input.trim();
    console.log('input', this.input);
    if (this.chatInputMessage === '') { return; }

    this.chatMessages.push({ message: this.chatInputMessage, user: this.human });
    this.isTyping = true;
    const botMessage = await this.chatService.send(this.chatInputMessage);
    this.chatInputMessage = '';
    this.scrollToBottom();
    this.chatMessages.push({ message: botMessage, user: this.bot });
    this.isTyping = false;
  }

  showDialog(): void {
    // this.position = position;
    this.visible = !this.visible;
    console.log(this.visible);
  }

  getSVGImageUrl(image): SafeResourceUrl {
    const base64string = btoa(image);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `data:image/svg+xml;base64,${base64string}`
    );
  }

}
