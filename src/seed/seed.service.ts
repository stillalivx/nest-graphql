import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { SEED_ITEMS, SEED_LIST, SEED_USERS } from './data/seed-data';
import { UsersService } from '../users/users.service';
import { ItemsService } from '../items/items.service';
import { ListItem } from '../list-item/entities/list-item.entity';
import { List } from '../lists/entities/list.entity';
import { ListsService } from '../lists/lists.service';
import { ListItemService } from '../list-item/list-item.service';

@Injectable()
export class SeedService {

  private readonly isProd: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Item) private readonly itemsRepository: Repository<Item>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(ListItem) private readonly listItemsRepository: Repository<ListItem>,
    @InjectRepository(List) private readonly listsRepository: Repository<List>,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly listsService: ListsService,
    private readonly listItemService: ListItemService
  ) {
    this.isProd = configService.get('STATE') === 'prod';
  }

  async executeSeed(): Promise<boolean> {
    if (this.isProd) throw new UnauthorizedException('We cannot run SEED on prod');

    await this.deleteDatabase();
    const user: User = await this.loadUsers();
    await this.loadItems(user);
    const list = await this.loadList(user);

    const items = await this.itemsService.findAll(user, { limit: 15, offset: 0 }, {});

    await this.loadListItems(list, items);

    return true;
  }

  private async deleteDatabase(): Promise<void> {
    await this.listItemsRepository.createQueryBuilder()
      .delete()
      .where({})
      .execute();

    await this.listsRepository.createQueryBuilder()
      .delete()
      .where({})
      .execute();

    await this.itemsRepository.createQueryBuilder()
      .delete()
      .where({})
      .execute();

    await this.usersRepository.createQueryBuilder()
      .delete()
      .where({})
      .execute();
  }

  private async loadUsers(): Promise<User> {
    const users = [];

    for (const user of SEED_USERS) {
      users.push(await this.usersService.create(user));
    }

    return users[0];
  }

  private async loadItems(user: User): Promise<void> {
    for (const item of SEED_ITEMS) {
      await this.itemsService.create(item, user);
    }
  }

  private async loadList(user: User): Promise<List> {
    const lists: List[] = [];

    for (const list of SEED_LIST) {
      lists.push(await this.listsService.create(list, user));
    }

    return lists[0];
  }

  async loadListItems(list: List, items: Item[]): Promise<void> {
    for (const item of items) {
      await this.listItemService.create({
        quantity: Math.round(Math.random() * 100),
        completed: Math.round(Math.random()) != 0,
        listId: list.id,
        itemId: item.id
      })
    }
  }

}
