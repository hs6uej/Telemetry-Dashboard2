import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @ApiProperty({ enum: ['admin', 'user', 'pending'] })
  @Column({ default: 'pending' })
  role: string;

  @ApiProperty()
  @Column({ default: false })
  approved: boolean;

  @ApiProperty()
  @Column({ default: false, name: 'password_reset_required' })
  passwordResetRequired: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
