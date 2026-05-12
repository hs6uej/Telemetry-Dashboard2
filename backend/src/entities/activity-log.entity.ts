import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('activity_logs')
export class ActivityLog {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional()
  @Column({ nullable: true, name: 'user_id' })
  userId: number;

  @ApiProperty()
  @Column()
  action: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  details: string;

  @ApiProperty()
  @CreateDateColumn()
  timestamp: Date;
}
