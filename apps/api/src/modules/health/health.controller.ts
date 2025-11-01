import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', dependencies: { database: 'up' } };
    } catch (error) {
      return {
        status: 'degraded',
        dependencies: { database: 'down', error: (error as Error).message }
      };
    }
  }
}
