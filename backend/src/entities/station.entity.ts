import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('stations')
export class Station {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column('float')
  lat: number;

  @ApiProperty()
  @Column('float')
  lng: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'water_level' })
  waterLevel: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'rain_level' })
  rainLevel: number;

  @ApiProperty({ enum: ['normal', 'warning', 'critical', 'offline'] })
  @Column({ default: 'normal' })
  status: string;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'left_bank' })
  leftBank: number;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'right_bank' })
  rightBank: number;

  @ApiPropertyOptional()
  @Column({ nullable: true, name: 'bed_data' })
  bedData: string;

  @ApiPropertyOptional()
  @Column('float', { nullable: true, name: 'warning_level' })
  warningLevel: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
