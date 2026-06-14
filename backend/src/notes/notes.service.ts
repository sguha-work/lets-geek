import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private readonly noteModel: Model<Note>) {}

  async findAll(): Promise<Note[]> {
    return this.noteModel.find().sort({ updatedAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.noteModel.findById(id).exec();
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async create(createDto: {
    title?: string;
    type: string;
    content?: string;
    listContent?: string[];
    checklistContent?: { text: string; checked: boolean }[];
  }): Promise<Note> {
    const newNote = new this.noteModel(createDto);
    return newNote.save();
  }

  async update(
    id: string,
    updateDto: {
      title?: string;
      type?: string;
      content?: string;
      listContent?: string[];
      checklistContent?: { text: string; checked: boolean }[];
    },
  ): Promise<Note> {
    const updated = await this.noteModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<Note> {
    const deleted = await this.noteModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return deleted;
  }
}
