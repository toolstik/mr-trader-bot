import { Type } from '@nestjs/common';
import { Promisable } from 'type-fest';

import { Version1 } from './versions/version1';

export interface AbstractVersion {
  update(): Promisable<void>;
}

type RegisteredVersion = {
  description: string;
  type: Type<AbstractVersion>;
};

export const REGISTERED_VERSIONS: Record<number, RegisteredVersion> = {
  1: {
    type: Version1,
    description:
      'Menu initialization. Notification settings menu. Initialize session settings.subscribeAll',
  },
};
