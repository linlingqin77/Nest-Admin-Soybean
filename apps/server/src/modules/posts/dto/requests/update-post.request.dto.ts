import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePostRequestDto } from './create-post.request.dto';

export class UpdatePostRequestDto extends CreatePostRequestDto {
  @ApiProperty({
    required: true,
    description: '岗位ID',
  })
  @IsNumber()
  postId: number;
}
