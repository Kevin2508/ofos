import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AIChatDto {
  @ApiProperty({
    description: 'User message or query for the OFOS AI assistant',
    example: 'Can you recommend some popular sourdough pizzas from Pizza Bella?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
