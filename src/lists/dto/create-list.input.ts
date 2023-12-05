import { InputType, Int, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateListInput {

  @Field(() => String)
  @IsString()
  name: string;

}
