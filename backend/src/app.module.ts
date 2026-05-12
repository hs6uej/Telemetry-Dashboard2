import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { ReadingsModule } from './readings/readings.module';
import { UsersModule } from './users/users.module';
import { User } from './entities/user.entity';
import { Station } from './entities/station.entity';
import { StationReading } from './entities/station-reading.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'db'),
        port: parseInt(config.get('DB_PORT', '5432')),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_DATABASE', 'telemetry'),
        entities: [User, Station, StationReading, ActivityLog],
        synchronize: false,
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    StationsModule,
    ReadingsModule,
    UsersModule,
  ],
})
export class AppModule {}
