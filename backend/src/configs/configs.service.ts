import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfig } from '../entities/api-config.entity';
import { Station } from '../entities/station.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { UpsertConfigDto } from './dto/upsert-config.dto';

@Injectable()
export class ConfigsService {
  constructor(
    @InjectRepository(ApiConfig) private repo: Repository<ApiConfig>,
    @InjectRepository(Station) private stationsRepo: Repository<Station>,
    @InjectRepository(ActivityLog) private logsRepo: Repository<ActivityLog>,
  ) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async findOne(id: number) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`ไม่พบการตั้งค่า ID ${id}`);
    return c;
  }

  async create(dto: UpsertConfigDto, userId: number) {
    const saved = await this.repo.save(this.repo.create(dto));
    await this.logsRepo.save({ userId, action: 'create_config', details: `Created API config: ${dto.name}` });
    return saved;
  }

  async update(id: number, dto: UpsertConfigDto, userId: number) {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    const saved = await this.repo.save(c);
    await this.logsRepo.save({ userId, action: 'update_config', details: `Updated API config: ${c.name}` });
    return saved;
  }

  async remove(id: number, userId: number) {
    const c = await this.findOne(id);
    await this.repo.remove(c);
    await this.logsRepo.save({ userId, action: 'delete_config', details: `Deleted API config: ${c.name}` });
    return { message: 'ลบการตั้งค่าสำเร็จ' };
  }

  async sendNow(id: number, userId: number) {
    const c = await this.findOne(id);
    const stations = await this.stationsRepo.find();
    const payload = { timestamp: new Date().toISOString(), stations };
    // Actual HTTP call would go here
    console.log(`[API Config] Sending to ${c.apiEndpoint}:`, JSON.stringify(payload).slice(0, 200));
    await this.repo.update(id, { lastSent: new Date() });
    await this.logsRepo.save({ userId, action: 'send_config', details: `Sent data to: ${c.name}` });
    return { message: `ส่งข้อมูลไปยัง ${c.name} สำเร็จ`, stations: stations.length };
  }
}
