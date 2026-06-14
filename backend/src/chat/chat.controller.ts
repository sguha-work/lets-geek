import { Controller, Post, Body } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  @Post()
  async getChatResponse(
    @Body() body: { message: string; sourceIds?: string[] },
  ) {
    const { message, sourceIds } = body;
    const sourcesCount = sourceIds?.length || 0;

    // Simulate an AI grounding check
    if (sourcesCount > 0) {
      return {
        message: `This is a mock AI response to your question: "${message}". I have processed your ${sourcesCount} selected source(s) and synthesized this answer. Based on the documents provided, the key definitions suggest that learning efficiency is improved when using active recall and spaced repetition in your sticky notes.`,
      };
    }

    return {
      message: `I received your message: "${message}". Note that you do not have any sources selected in the left panel. Selecting sources will ground my responses in your course materials!`,
    };
  }
}
