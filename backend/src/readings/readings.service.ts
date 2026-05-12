import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StationReading } from '../entities/station-reading.entity';
import { Station } from '../entities/station.entity';
import { CreateReadingDto } from './dto/create-reading.dto';

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(StationReading) private readingsRepo: Repository<StationReading>,
    @InjectRepository(Station) private stationsRepo: Repository<Station>,
  ) {}

  async getReadings(stationId: number, hours = 24) {
    return this.readingsRepo
      .createQueryBuilder('r')
      .where('r.station_id = :stationId', { stationId })
      .andWhere(`r.time >= NOW() - INTERVAL '${hours} hours'`)
      .orderBy('r.time', 'ASC')
      .getMany();
  }

  async addReading(stationId: number, dto: CreateReadingDto) {
    const reading = this.readingsRepo.create({
      time: dto.time ? new Date(dto.time) : new Date(),
      stationId,
      waterLevel: dto.waterLevel,
      rainLevel: dto.rainLevel,
      flowRate: dto.flowRate,
    });
    const saved = await this.readingsRepo.save(reading);

    // Update station current values
    const update: Partial<Station> = {};
    if (dto.waterLevel !== undefined) update.waterLevel = dto.waterLevel;
    if (dto.rainLevel !== undefined) update.rainLevel = dto.rainLevel;
    if (dto.waterLevel !== undefined) {
      const station = await this.stationsRepo.findOne({ where: { id: stationId } });
      if (station) {
        const wl = dto.waterLevel;
        const warnLevel = station.warningLevel ?? station.leftBank ?? 999;
        if (wl === null) update.status = 'offline';
        else if (wl >= warnLevel) update.status = 'critical';
        else if (wl >= warnLevel * 0.85) update.status = 'warning';
        else update.status = 'normal';
      }
    }
    await this.stationsRepo.update(stationId, update);
    return saved;
  }

  async getLatestAll() {
    return this.readingsRepo.query(`
      SELECT DISTINCT ON (station_id)
        station_id, time, water_level, rain_level, flow_rate
      FROM station_readings
      ORDER BY station_id, time DESC
    `);
  }
}
