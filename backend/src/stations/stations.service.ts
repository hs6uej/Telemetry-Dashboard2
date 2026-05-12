import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from '../entities/station.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station) private stationsRepo: Repository<Station>,
    @InjectRepository(ActivityLog) private logsRepo: Repository<ActivityLog>,
  ) {}

  findAll() {
    return this.stationsRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const station = await this.stationsRepo.findOne({ where: { id } });
    if (!station) throw new NotFoundException(`ไม่พบสถานี ID ${id}`);
    return station;
  }

  async create(dto: CreateStationDto, userId: number) {
    const station = this.stationsRepo.create(dto);
    const saved = await this.stationsRepo.save(station);
    await this.logsRepo.save({ userId, action: 'create_station', details: `Created station: ${dto.name}` });
    return saved;
  }

  async update(id: number, dto: UpdateStationDto, userId: number) {
    const station = await this.findOne(id);
    Object.assign(station, dto);
    const saved = await this.stationsRepo.save(station);
    await this.logsRepo.save({ userId, action: 'update_station', details: `Updated station: ${station.name}` });
    return saved;
  }

  async remove(id: number, userId: number) {
    const station = await this.findOne(id);
    await this.stationsRepo.remove(station);
    await this.logsRepo.save({ userId, action: 'delete_station', details: `Deleted station: ${station.name}` });
    return { message: 'ลบสถานีสำเร็จ' };
  }
}
