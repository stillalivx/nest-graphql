import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { SignupInput } from '../auth/dto/inputs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { UpdateUserInput } from './dto/update-user.input';
import { PaginationArgs, SearchArgs } from '../common/dto/args';

@Injectable()
export class UsersService {

  private logger: Logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async create(signupInput: SignupInput): Promise<User> {
    try {
      const newUser = this.usersRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10)
      });

      return await this.usersRepository.save(newUser);
    } catch (e) {
      this.handleDBErrors(e);
    }
  }

  async update(id: string, updateUserInput: UpdateUserInput, user: User): Promise<User> {
    // TODO: update by
    try {
      const userToUpdate = await this.usersRepository.preload({
        ...updateUserInput,
        id
      });

      if (!userToUpdate) throw new NotFoundException(`User with id ${id} not found`);

      userToUpdate.lastUpdateBy = user;

      return await this.usersRepository.save(userToUpdate);
    } catch (e) {
      this.handleDBErrors(e);
    }
  }

  async findAll(roles: ValidRoles[], paginationArgs: PaginationArgs, searchArgs: SearchArgs): Promise<User[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.usersRepository.createQueryBuilder()
      .take(limit)
      .skip(offset);

    if (search) {
      queryBuilder.andWhere('LOWER("fullName") LIKE :name', { name: `%${ search.toLowerCase() }%` })
    }

    if (roles.length === 0) {
      return queryBuilder.getMany()
    }

    return queryBuilder
      .andWhere('ARRAY[roles] && ARRAY[:...roles]')
      .setParameter('roles', roles)
      .getMany();
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ email });
    } catch (e) {
      throw new NotFoundException(`${ email } not found`);
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ id });
    } catch (e) {
      throw new NotFoundException(`${ id } not found`);
    }
  }

  async block(id: string, adminUser: User): Promise<User> {
    const userToBlock = await this.findOneById(id);

    userToBlock.isActive = false;
    userToBlock.lastUpdateBy = adminUser;

    return await this.usersRepository.save(userToBlock);
  }

  private handleDBErrors(e: any): never {
    this.logger.error(e);

    if (e.code === '23505') {
      throw new BadRequestException(e.detail.replace('Key', ''));
    }

    throw new InternalServerErrorException('Please check server logs');
  }
}
