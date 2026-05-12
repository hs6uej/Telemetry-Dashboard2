import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { StationReading } from '../entities/station-reading.entity';
import { Station } from '../entities/station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StationReading, Station])],
  controllers: [ReadingsController],
  providers: [ReadingsService],
})
export class ReadingsModule {}
