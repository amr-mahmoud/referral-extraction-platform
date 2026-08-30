import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { QUEUE_SERVICE_PORT } from '../application/ports/queue-service.port';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { SqsService } from '../infrastructure/queue/sqs.service';
import { AuthController } from './http/auth/auth.controller';
import { ClinicsController } from './http/clinics/clinics.controller';
import { JwtAuthGuard } from './http/guards/jwt-auth.guard';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [AuthController, ClinicsController],
  providers: [
    JwtAuthGuard,
    {
      provide: QUEUE_SERVICE_PORT,
      useClass: SqsService,
    },
  ],
})
export class InterfaceModule {}
