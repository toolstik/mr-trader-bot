type CommandInfo = { name: string; description?: string };
type CommandMeta = { info: CommandInfo; target: Function };
const Commands = [] as CommandMeta[];

export function Command(info: CommandInfo) {
  return (target => {
    Commands.push({
      info,
      target: target.constructor,
    });
    return target;
  }) as ClassDecorator;
}
