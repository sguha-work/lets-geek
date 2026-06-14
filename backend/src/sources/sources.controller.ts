import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async findAll() {
    return this.sourcesService.findAll();
  }

  @Post()
  async create(
    @Body() createDto: { title: string; type: string; url: string; content?: string },
  ) {
    return this.sourcesService.create(createDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sourcesService.delete(id);
  }
}
