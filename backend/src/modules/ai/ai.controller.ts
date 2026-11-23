import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { AIChatDto } from './dto/ai.dto';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send message to OFOS AI Food Assistant' })
  @ApiResponse({ status: 200, description: 'AI assistant reply returned successfully' })
  async chat(@Req() req: any, @Body() dto: AIChatDto) {
    const userId = req.user.id.toString();
    const reply = await this.aiService.processChat(userId, dto.message);
    return {
      success: true,
      message: 'Response generated successfully',
      data: {
        reply,
      },
    };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear AI chat conversation history for the current user' })
  @ApiResponse({ status: 200, description: 'Chat history cleared' })
  async resetChat(@Req() req: any) {
    const userId = req.user.id.toString();
    this.aiService.clearHistory(userId);
    return {
      success: true,
      message: 'Chat history cleared successfully',
    };
  }
}
