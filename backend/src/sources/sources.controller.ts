import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { SourcesService } from './sources.service';

// Ensure uploads directory exists
const UPLOADS_DIR = join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

// Allowed MIME types per source type category
const ALLOWED_MIMES = [
  // pdf
  'application/pdf',
  // doc
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  // audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
  // video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  // general / url-type documents
  'application/json',
  'text/html',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async findAll() {
    return this.sourcesService.findAll();
  }

  // --- JSON-only creation (no file) ---
  @Post()
  async create(
    @Body() createDto: { title: string; type: string; url: string; content?: string },
  ) {
    return this.sourcesService.create(createDto);
  }

  // --- Multipart creation with optional file upload ---
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadAndCreate(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; type: string; url?: string; content?: string },
  ) {
    const title = body.title?.trim() || (file ? file.originalname : 'Untitled');
    const url = body.url?.trim() || (file ? `/uploads/${file.filename}` : '');

    const dto = {
      title,
      type: body.type,
      url,
      content: body.content?.trim() || undefined,
      ...(file && {
        filePath: `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
      }),
    };

    return this.sourcesService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sourcesService.delete(id);
  }
}
