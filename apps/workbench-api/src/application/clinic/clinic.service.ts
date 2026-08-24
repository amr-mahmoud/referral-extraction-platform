import { Inject, Injectable } from '@nestjs/common';
import { Clinic } from '../../domain/clinic/clinic.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { NotImplementedError } from '../errors/not-implemented.error';
import {
  CLINIC_REPOSITORY_PORT,
  type ClinicRepositoryPort,
} from '../ports/clinic-repository.port';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../ports/password-hasher.port';
import { TOKEN_PORT, type TokenPort } from '../ports/token.port';

export interface ClinicSignupCommand {
  clinicName: string;
  username: string;
  password: string;
}

export interface ClinicLoginCommand {
  username: string;
  password: string;
}

export interface ClinicLoginResult {
  clinic: Clinic;
  token: string;
}

@Injectable()
export class ClinicService {
  public constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepository: ClinicRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_PORT) private readonly tokenService: TokenPort,
  ) {}

  public signup(command: ClinicSignupCommand): Promise<Clinic> {
    void command;
    throw new NotImplementedError('ClinicService.signup');
  }

  public login(command: ClinicLoginCommand): Promise<ClinicLoginResult> {
    void command;
    throw new NotImplementedError('ClinicService.login');
  }

  public getClinic(clinicId: ClinicId): Promise<Clinic> {
    void clinicId;
    throw new NotImplementedError('ClinicService.getClinic');
  }
}
