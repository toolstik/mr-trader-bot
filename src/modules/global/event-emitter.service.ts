import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { interval, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, take, timeout } from 'rxjs/operators';

export declare type EventType<T> = {
  new (...args: any[]): T;
  event: string;
};

@Injectable()
export class EventEmitterService {
  private processing = new Set();

  private size$: Observable<number>;

  constructor(private eventEmitter: EventEmitter2, private log: Logger) {
    this.size$ = interval(50).pipe(
      startWith(0),
      map(() => this.processing.size),
      shareReplay(1),
    );

    this.size$.subscribe();
  }

  emit<T>(type: EventType<T>, body: T) {
    void this.emitAsync(type, body);
  }

  async emitAsync<T>(type: EventType<T>, body: T) {
    const id = Math.random();
    // console.debug('Event emit', type.event, id, body);

    this.processing.add(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.eventEmitter.emitAsync(type.event, body);
    this.processing.delete(id);

    // console.debug('Event processed', type.event, id, result);
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
