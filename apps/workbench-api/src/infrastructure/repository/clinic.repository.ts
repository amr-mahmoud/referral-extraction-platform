import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import { ClinicRepositoryPort } from '../../application/ports/clinic-repository.port';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClinicRepository implements ClinicRepositoryPort {
  public constructor(private readonly prismaService: PrismaService) {}

  public findById(id: ClinicId): Promise<Clinic | null> {
    void id;
    throw new NotImplementedError('PrismaClinicRepository.findById');
  }

  public findByUsername(username: string): Promise<Clinic | null> {
    void username;
    throw new NotImplementedError('PrismaClinicRepository.findByUsername');
  }

  public save(clinic: Clinic): Promise<Clinic> {
    void clinic;
    throw new NotImplementedError('PrismaClinicRepository.save');
  }
}
