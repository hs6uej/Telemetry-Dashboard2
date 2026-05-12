import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('api_configs')
export class ApiConfig {
  @ApiProperty() @PrimaryGeneratedColumn() id: number;
  @ApiProperty() @Column() name: string;
  @ApiProperty() @Column({ name: 'api_endpoint' }) apiEndpoint: string;
  @ApiPropertyOptional() @Column({ nullable: true, name: 'api_key' }) apiKey: string;
  @ApiProperty() @Column({ name: 'send_interval', default: 300 }) sendInterval: number;
  @ApiProperty() @Column({ default: true }) enabled: boolean;
  @ApiPropertyOptional() @Column({ nullable: true, name: 'last_sent', type: 'timestamptz' }) lastSent: Date;
  @ApiProperty() @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @ApiProperty() @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
