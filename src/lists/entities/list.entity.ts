import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ListItem } from '../../list-item/entities/list-item.entity';

@Entity({ name: 'lists' })
@ObjectType()
export class List {

  @Field(() => ID, { name: 'id' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { name: 'name' })
  @Column()
  name: string;

  @Field(() => User)
  @Index('userId-list-index')
  @ManyToOne(() => User, (user) => user.lists, { nullable: false, lazy: true })
  user: User;

  @OneToMany(() => ListItem, (listItem) => listItem.list, { lazy: true })
  // @Field(() => [ListItem])
  listItem: ListItem[];

}
