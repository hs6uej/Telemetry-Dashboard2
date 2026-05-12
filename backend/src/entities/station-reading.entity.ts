import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('station_readings')
export class StationReading {
  @ApiProperty()
  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @ApiProperty()
  @PrimaryColumn({ name: 'station_id' })
  stationId: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'water_level' })
  waterLevel: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'rain_level' })
  rainLevel: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'flow_rate' })
  flowRate: number;
}
