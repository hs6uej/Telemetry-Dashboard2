import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(ActivityLog) private logsRepo: Repository<ActivityLog>,
  ) {}

  findAll() {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`ไม่พบผู้ใช้ ID ${id}`);
    return user;
  }

  async create(dto: CreateUserDto, adminId: number) {
    const existing = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('ชื่อผู้ใช้นี้มีในระบบแล้ว');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    const saved = await this.usersRepo.save(user);
    await this.logsRepo.save({ userId: adminId, action: 'create_user', details: `Created user: ${dto.username}` });
    return saved;
  }

  async update(id: number, dto: UpdateUserDto, adminId: number) {
    const user = await this.findOne(id);
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    Object.assign(user, dto);
    const saved = await this.usersRepo.save(user);
    await this.logsRepo.save({ userId: adminId, action: 'update_user', details: `Updated user: ${user.username}` });
    return saved;
  }

  async remove(id: number, adminId: number) {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
    await this.logsRepo.save({ userId: adminId, action: 'delete_user', details: `Deleted user: ${user.username}` });
    return { message: 'ลบผู้ใช้สำเร็จ' };
  }

  async approve(id: number, adminId: number) {
    const user = await this.findOne(id);
    user.approved = true;
    if (user.role === 'pending') user.role = 'user';
    const saved = await this.usersRepo.save(user);
    await this.logsRepo.save({ userId: adminId, action: 'approve_user', details: `Approved user: ${user.username}` });
    return saved;
  }

  getLogs() {
    return this.logsRepo.query(`
      SELECT l.*, u.username AS user_name
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 200
    `);
  }

  async clearLogs(adminId: number) {
    await this.logsRepo.query(`DELETE FROM activity_logs WHERE timestamp < NOW() - INTERVAL '30 days'`);
    await this.logsRepo.save({ userId: adminId, action: 'clear_logs', details: 'Cleared logs older than 30 days' });
    return { message: 'ล้าง log เก่าเกิน 30 วันสำเร็จ' };
  }
}
