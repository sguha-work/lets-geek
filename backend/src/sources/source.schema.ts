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

  // File upload fields (populated when a file is uploaded)
  @Prop()
  filePath: string; // server-relative path e.g. /uploads/abc123.pdf

  @Prop()
  fileName: string; // original filename from the client

  @Prop()
  fileSize: number; // bytes
}

export const SourceSchema = SchemaFactory.createForClass(Source);
