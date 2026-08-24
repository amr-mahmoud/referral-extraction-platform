import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ApplicationService } from './application.service';

@Module({
  imports: [InfrastructureModule],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
