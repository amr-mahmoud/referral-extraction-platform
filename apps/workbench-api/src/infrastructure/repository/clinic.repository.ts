import { Injectable } from '@nestjs/common';
import { ClinicRepositoryPort } from '../../application/ports/clinic-repository.port';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ClinicMapper } from './clinic.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClinicRepository implements ClinicRepositoryPort {
  public constructor(private readonly prisma: PrismaService) {}

  public async findById(id: ClinicId): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({
      where: { id: id.value },
    });

    if (!row) {
      return null;
    }

    return ClinicMapper.toDomain(row);
  }

  public async findByUsername(username: string): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({
      where: { username },
    });

    if (!row) {
      return null;
    }

    return ClinicMapper.toDomain(row);
  }

  public async save(clinic: Clinic): Promise<Clinic> {
    const data = ClinicMapper.toPersistence(clinic);

    const row = await this.prisma.clinic.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    return ClinicMapper.toDomain(row);
  }
}
