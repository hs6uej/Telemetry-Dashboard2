import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('configs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('configs')
export class ConfigsController {
  constructor(private svc: ConfigsService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] รายการ API ภายนอก' })
  findAll() { return this.svc.findAll(); }

  @Post()
  @ApiOperation({ summary: '[Admin] เพิ่มการตั้งค่า API' })
  create(@Body() dto: UpsertConfigDto, @Request() req) { return this.svc.create(dto, req.user.id); }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] แก้ไขการตั้งค่า API' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertConfigDto, @Request() req) { return this.svc.update(id, dto, req.user.id); }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] ลบการตั้งค่า API' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) { return this.svc.remove(id, req.user.id); }

  @Post(':id/send')
  @ApiOperation({ summary: '[Admin] ทดสอบส่งข้อมูลทันที' })
  sendNow(@Param('id', ParseIntPipe) id: number, @Request() req) { return this.svc.sendNow(id, req.user.id); }
}
