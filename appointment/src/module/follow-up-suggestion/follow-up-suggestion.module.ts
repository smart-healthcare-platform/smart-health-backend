import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpSuggestion } from './follow-up-suggestion.entity';
import { FollowUpSuggestionService } from './follow-up-suggestion.service';
import { FollowUpSuggestionController } from './follow-up-suggestion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpSuggestion])],
  controllers: [FollowUpSuggestionController],
  providers: [FollowUpSuggestionService],
  exports: [FollowUpSuggestionService],
})
export class FollowUpSuggestionModule {}
