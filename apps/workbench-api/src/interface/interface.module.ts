import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthController } from './http/auth/auth.controller';
import { ClinicsController } from './http/clinics/clinics.controller';
import { JwtAuthGuard } from './http/guards/jwt-auth.guard';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [AuthController, ClinicsController],
  providers: [JwtAuthGuard],
})
export class InterfaceModule {}
