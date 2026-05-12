import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] ดูรายการผู้ใช้ทั้งหมด' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '[Admin] สร้างผู้ใช้ใหม่' })
  create(@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.create(dto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] แก้ไขข้อมูลผู้ใช้' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] ลบผู้ใช้' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.remove(id, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '[Admin] อนุมัติผู้ใช้' })
  approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.approve(id, req.user.id);
  }

  @Get('logs')
  @ApiOperation({ summary: '[Admin] ดู Activity Logs' })
  getLogs() {
    return this.usersService.getLogs();
  }

  @Delete('logs/clear')
  @ApiOperation({ summary: '[Admin] ล้าง log เก่าเกิน 30 วัน' })
  clearLogs(@Request() req) {
    return this.usersService.clearLogs(req.user.id);
  }
}
