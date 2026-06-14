import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ChecklistItem {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, default: false })
  checked: boolean;
}

const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop()
  title?: string;

  @Prop({ required: true, enum: ['text', 'list', 'checklist'] })
  type: string;

  @Prop()
  content?: string;

  @Prop([String])
  listContent?: string[];

  @Prop({ type: [ChecklistItemSchema] })
  checklistContent?: ChecklistItem[];
}

export const NoteSchema = SchemaFactory.createForClass(Note);
