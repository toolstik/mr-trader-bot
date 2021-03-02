import { Composer } from 'telegraf';

const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]*)$/i;

function parse(text: string) {
  const parts = regex.exec(text);
  if (!parts) return null;
  return {
    text: text,
    command: parts[1],
    bot: parts[2],
    args: parts[3],
    splitArgs: parts[3].split(/\s+/),
  };
}

export type CommandParts = ReturnType<typeof parse>;

/* eslint no-param-reassign: ["error", { "props": false }] */
const commandParts = () =>
  Composer.on('text', (ctx, next) => {
    const command = parse(ctx.message.text);

    if (command) {
      ctx.state.command = command;
    }

    return next();
  });

export const commandPartsMiddleWare = commandParts();
