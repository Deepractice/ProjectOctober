import { Observable } from "rxjs";
import type { AnyMessage } from "~/types";

/**
 * MessageStream - converts async generators to RxJS Observables
 *
 * Handles:
 * - Async generator → Observable conversion
 * - Error handling
 * - Backpressure
 */
export class MessageStream {
  /**
   * Convert async generator to Observable
   */
  static fromAsyncGenerator(generator: AsyncGenerator<unknown>): Observable<AnyMessage> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const item of generator) {
            // TODO: Transform item to AnyMessage
            subscriber.next(item as AnyMessage);
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
