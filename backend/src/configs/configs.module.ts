import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsController } from './configs.controller';
import { ConfigsService } from './configs.service';
import { ApiConfig } from '../entities/api-config.entity';
import { Station } from '../entities/station.entity';
import { ActivityLog } from '../entities/activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiConfig, Station, ActivityLog])],
  controllers: [ConfigsController],
  providers: [ConfigsService],
})
export class ConfigsModule {}
