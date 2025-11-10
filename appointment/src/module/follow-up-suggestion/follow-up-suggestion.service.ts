import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpSuggestion } from './follow-up-suggestion.entity';
import { CreateFollowUpSuggestionDto } from './dto/create-follow-up-suggestion.dto';
import { FollowUpSuggestionStatus } from './enums/follow-up-suggestion-status.enum';

@Injectable()
export class FollowUpSuggestionService {
  constructor(
    @InjectRepository(FollowUpSuggestion)
    private readonly repo: Repository<FollowUpSuggestion>,
  ) { }

  async create(dto: CreateFollowUpSuggestionDto) {
    const suggestion = this.repo.create({
      ...dto,
      suggestedDate: dto.suggestedDate ? new Date(dto.suggestedDate) : undefined,
      status: FollowUpSuggestionStatus.PENDING,
    });
    return this.repo.save(suggestion);
  }

  async findAllByPatient(patientId: string) {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingByPatient(patientId: string) {
    return this.repo.find({
      where: {
        patientId,
        status: FollowUpSuggestionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }


}
