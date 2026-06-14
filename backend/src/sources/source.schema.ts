import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Source extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string; // 'pdf' | 'doc' | 'audio' | 'video' | 'url'

  @Prop({ required: true })
  url: string;

  @Prop()
  content: string; // text contents for preview
}

export const SourceSchema = SchemaFactory.createForClass(Source);
