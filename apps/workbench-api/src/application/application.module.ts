import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ClinicService } from './clinic/clinic.service';
import { ExtractionSchemaService } from './extraction-schema/extraction-schema.service';
import { ReferralService } from './referral/referral.service';

@Module({
  imports: [InfrastructureModule],
  providers: [ClinicService, ExtractionSchemaService, ReferralService],
  exports: [ClinicService, ExtractionSchemaService, ReferralService],
})
export class ApplicationModule {}
