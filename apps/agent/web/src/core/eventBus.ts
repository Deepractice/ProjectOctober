/**
 * EventBus - Unified Event Stream
 * Single RxJS Subject for all application events
 */

import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import type { AppEvent } from "./events";

class EventBus {
  private events$ = new Subject<AppEvent>();
  private debugMode = false;

  /**
   * Emit an event to the bus
   */
  emit(event: AppEvent): void {
    if (this.debugMode) {
      console.log("[EventBus]", event.type, event);
    }
    this.events$.next(event);
  }

  /**
   * Subscribe to specific event types using a type guard
   */
  on<T extends AppEvent>(predicate: (event: AppEvent) => event is T): Observable<T> {
    return this.events$.pipe(filter(predicate));
  }

  /**
   * Subscribe to all events
   */
  stream(): Observable<AppEvent> {
    return this.events$.asObservable();
  }

  /**
   * Enable debug logging
   */
  enableDebug(): void {
    this.debugMode = true;
    console.log("[EventBus] Debug mode enabled");
  }

  /**
   * Disable debug logging
   */
  disableDebug(): void {
    this.debugMode = false;
    console.log("[EventBus] Debug mode disabled");
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Enable debug in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  eventBus.enableDebug();
}
