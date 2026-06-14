import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Source } from './source.schema';

@Injectable()
export class SourcesService {
  constructor(
    @InjectModel(Source.name) private readonly sourceModel: Model<Source>,
  ) {}

  async findAll(): Promise<Source[]> {
    return this.sourceModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(createDto: {
    title: string;
    type: string;
    url: string;
    content?: string;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
  }): Promise<Source> {
    let content = createDto.content || '';
    
    // Auto-generate realistic study content if not provided
    if (!content) {
      const title = createDto.title;
      if (createDto.type === 'pdf') {
        content = `# STUDY GUIDE: ${title}\n\n## Section 1: Overview\nThis textbook excerpt provides an in-depth analysis of the topic. Key theories are outlined to prepare students for the final examinations.\n\n## Section 2: Core Concepts\n1. Primary definitions and frameworks.\n2. Methodologies and modern applications.\n3. Case studies demonstrating practical implications.`;
      } else if (createDto.type === 'doc') {
        content = `# DOCUMENT: ${title}\n\nThis study document summarises class notes and key definitions. Students should review the formulas and historical context described herein. Focus on understanding the relationships between variable models and system outputs.`;
      } else if (createDto.type === 'audio' || createDto.type === 'video') {
        content = `# TRANSCRIPT: ${title}\n\n[00:02] Professor: Welcome everyone. In today's lecture, we will cover the fundamentals.\n[05:30] Let's look at the correlation between inputs and outputs.\n[12:15] Question from Student: How does this apply to real-world scenarios?\n[12:45] Professor: Excellent question. Let's look at the historical data...`;
      } else if (createDto.type === 'url') {
        content = `# ARTICLE: ${title}\n\nPublished in Academic Review Weekly. This article discusses recent developments and critical reviews. It challenges traditional paradigms and introduces a modern, hybrid approach that has gained significant traction in the community.`;
      } else {
        content = `Study notes and metadata for ${title}. Content is ready for extraction and AI-driven analysis.`;
      }
    }

    const newSource = new this.sourceModel({
      ...createDto,
      content,
    });
    return newSource.save();
  }

  async delete(id: string): Promise<Source> {
    const deleted = await this.sourceModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return deleted;
  }
}
