import { Command, Ctx, Hears, Start, Update, Sender } from 'nestjs-telegraf';
import { UpdateType as TelegrafUpdateType } from 'telegraf/typings/telegram-types';
import { MyContext } from '../types/my-context';

@Update()
export class BotUpdate {

  @Start()
  onStart(): string {
    return 'Good morning!';
  }

  @Command('test1')
  async test1Command(@Ctx() ctx: MyContext){
	return 'It is test1!';
  }

//   @Hears(['hi', 'hello', 'hey', 'qq'])
//   onGreetings(
//     @UpdateType() updateType: TelegrafUpdateType,
//     @Sender('first_name') firstName: string,
//   ): string {
//     return `Hey ${firstName}`;
//   }

//   @Command('scene')
//   async onSceneCommand(@Ctx() ctx: Context): Promise<void> {
//     await ctx.scene.enter(HELLO_SCENE_ID);
//   }
}
