import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll() {
    return this.notesService.findAll();
  }

  @Post()
  async create(
    @Body()
    createDto: {
      title?: string;
      type: string;
      content?: string;
      listContent?: string[];
      checklistContent?: { text: string; checked: boolean }[];
    },
  ) {
    return this.notesService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: {
      title?: string;
      type?: string;
      content?: string;
      listContent?: string[];
      checklistContent?: { text: string; checked: boolean }[];
    },
  ) {
    return this.notesService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.notesService.delete(id);
  }
}
