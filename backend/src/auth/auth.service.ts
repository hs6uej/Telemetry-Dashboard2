import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username },
      select: ['id', 'username', 'password', 'role', 'approved'],
    });
    if (!user) throw new UnauthorizedException('ไม่พบชื่อผู้ใช้งาน');
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    if (!user.approved) throw new UnauthorizedException('บัญชียังไม่ได้รับการอนุมัติ');

    const token = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });
    return { access_token: token, token_type: 'Bearer', user: { id: user.id, username: user.username, role: user.role } };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('ชื่อผู้ใช้นี้มีในระบบแล้ว');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ username: dto.username, password: hashed, role: 'pending', approved: false });
    await this.usersRepo.save(user);
    return { message: 'ลงทะเบียนสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ' };
  }

  async getMe(userId: number) {
    return this.usersRepo.findOne({ where: { id: userId } });
  }
}
