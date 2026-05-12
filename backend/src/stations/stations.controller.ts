import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Station } from '../entities/station.entity';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการสถานีทั้งหมด (public)' })
  @ApiResponse({ status: 200, type: [Station] })
  findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลสถานีตาม ID (public)' })
  @ApiResponse({ status: 200, type: Station })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] เพิ่มสถานีใหม่' })
  @ApiResponse({ status: 201, type: Station })
  create(@Body() dto: CreateStationDto, @Request() req) {
    return this.stationsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] แก้ไขข้อมูลสถานี' })
  @ApiResponse({ status: 200, type: Station })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStationDto, @Request() req) {
    return this.stationsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] ลบสถานี' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.stationsService.remove(id, req.user.id);
  }
}
