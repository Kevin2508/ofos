import { Request, Response } from 'express';
import * as aiService from './ai.service.ts';

export async function chatController(req: Request, res: Response): Promise<any> {
  try {
    const customerUserId = BigInt((req as any).user.id);
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const reply = await aiService.processChat(customerUserId, message);

    return res.status(200).json({
      success: true,
      message: 'Response generated successfully',
      data: {
        reply,
      },
    });
  } catch (error: any) {
    console.error('[AI Chat Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI chat request',
    });
  }
}

export async function resetChatController(req: Request, res: Response): Promise<any> {
  try {
    const customerUserId = BigInt((req as any).user.id);
    await aiService.clearHistory(customerUserId);

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (error: any) {
    console.error('[AI Reset Chat Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear chat history',
    });
  }
}
