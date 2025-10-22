import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpSuggestion } from './follow_up_suggestion.entity';
import { FollowUpSuggestionsService } from './follow_up_suggestions.service';
import { FollowUpSuggestionsController } from './follow_up_suggestions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpSuggestion])],
  controllers: [FollowUpSuggestionsController],
  providers: [FollowUpSuggestionsService],
  exports: [FollowUpSuggestionsService],
})
export class FollowUpSuggestionsModule {}
