import { Controller, Post, Get, Body, Request, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'เข้าสู่ระบบ รับ JWT token' })
  @ApiResponse({ status: 200, description: 'Login สำเร็จ คืน access_token' })
  @ApiResponse({ status: 401, description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'ลงทะเบียนผู้ใช้ใหม่ (รอการอนุมัติ)' })
  @ApiResponse({ status: 201, description: 'ลงทะเบียนสำเร็จ' })
  @ApiResponse({ status: 409, description: 'ชื่อผู้ใช้ซ้ำ' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ปัจจุบัน' })
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }
}
