import { Module, forwardRef } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DeptModule } from '../dept/dept.module';
import { PostRepository } from './post.repository';

@Module({
  imports: [forwardRef(() => DeptModule)],
  controllers: [PostController],
  providers: [PostService, PostRepository],
  exports: [PostService],
})
export class PostModule {}
