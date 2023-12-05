import { CreateListInput } from './create-list.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateListInput extends PartialType(CreateListInput) {
  @Field(() => String)
  @IsUUID()
  id: string;
}
