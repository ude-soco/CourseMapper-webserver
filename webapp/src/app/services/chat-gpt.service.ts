import { Injectable } from '@angular/core';
import {Configuration, OpenAIApi} from 'openai';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService {
  private client: any;
  private conversationHistory: any[];

  constructor() {
    console.log('process.env.OPENAI_API_KEY', process.env['OPENAI_API_KEY']);
    const configuration = new Configuration({
      apiKey: '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',
    });
    this.client = new OpenAIApi(configuration);
    this.conversationHistory = [{role: 'system', content: 'You are a helpful assistant.'}];
  }

  async send(message: string) {
    this.conversationHistory.push({ role: 'user', content: message });
    console.log('conversationHistory', this.conversationHistory);
    try{
      const completion = await this.client.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: this.conversationHistory,
      });
      console.log('completion', completion.data.choices);
      const response = completion.data.choices[0].message.content;

      // Add the assistant's response to the conversation history
      this.conversationHistory.push({ role: 'assistant', content: response });
      console.log('conversationHistory', this.conversationHistory);

      return response;

    } catch (error) {
      console.error(error);
    }
  }
}
