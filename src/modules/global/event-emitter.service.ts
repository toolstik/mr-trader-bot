import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { interval, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, take, timeout } from 'rxjs/operators';

import { PlainLogger } from './plain-logger';

export declare type EventType<T> = {
  new (...args: any[]): T;
  event: string;
};

@Injectable()
export class EventEmitterService {
  private processing = new Set();

  private size$: Observable<number>;

  constructor(private eventEmitter: EventEmitter2, private log: PlainLogger) {
    this.size$ = interval(50).pipe(
      startWith(0),
      map(() => this.processing.size),
      shareReplay(1),
    );

    this.size$.subscribe();
  }

  private emit<T>(type: EventType<T>, body: T) {
    void this.emitAsync(type, body);
  }

  async emitAsync<T>(type: EventType<T>, body: T) {
    const id = Math.random();
    this.log.debug('Event emitted:', id, { type: type.event, body });

    this.processing.add(id);
    const result = await this.eventEmitter
      .emitAsync(type.event, body)
      .then(r => {
        this.log.debug('Event processed', id, r);
        return r;
      })
      .catch(e => {
        this.log.error('Event processing error', id, { error: e });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return null as any[];
      })
      .finally(() => {
        this.processing.delete(id);
      });

    return result;
  }

  waitAll(timeoutMs = 180000): Promise<boolean> {
    return this.size$
      .pipe(
        filter(i => i <= 0),
        map(() => true),
        take(1),
        timeout(timeoutMs),
        catchError(() => of(false)),
      )
      .toPromise();
  }
}
