/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */
import { Entity } from './Entity';
import { SimEvent } from './SimEvent';

class SimRequest<T> {
    saved_deliver?: () => void;
    entity: T;
    scheduledAt: number;
    deliverAt: number;
    cancelled = false;
    group: SimRequest<any>[] | null = null;
    callbacks: [Function, T?, (any[] | any)?][] = [];
    noRenege = false;
    source: any = null;
    data: any = null;
    msg: any = null;
    duration!: number;
    lastIssued!: number;
    remaining!: number;
    amount!: number;
    filter!: (obj: any) => boolean;
    obj: any;
    order!: number;
    priority: number = 0;

    /**
     *
     * @param entity
     * @param currentTime
     * @param deliverAt
     */
    constructor(entity: T, currentTime: number, deliverAt: number) {
        this.entity = entity;
        this.scheduledAt = currentTime;
        this.deliverAt = deliverAt;
    }

    /**
     *
     */
    cancel(): SimRequest<T> | undefined {
        // Ask the main request to handle cancellation
        if (this.group && this.group[0] != this) {
            return this.group[0].cancel();
        }

        // --> this is main request
        if (this.noRenege) return this;

        // if already cancelled, do nothing
        if (this.cancelled) return;

        // set flag
        this.cancelled = true;

        if (this.deliverAt == 0 && this.entity instanceof Entity) {
            this.deliverAt = this.entity.time();
        }

        if (this.source) {
            this.source.progressPutQueue.call(this.source);
            this.source.progressGetQueue.call(this.source);
        }

        if (!this.group) {
            return;
        }
        for (let i = 1; i < this.group.length; i++) {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0 && this.entity instanceof Entity) {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    }

    /**
     *
     * @param callback
     * @param context
     * @param argument
     */
    done(callback: Function, context?: T, argument?: (any[] | any)): SimRequest<T> {
        // if (context && argument) this.callbacks.push([callback, context, argument]);
        // if (context && !argument) this.callbacks.push([callback, context]);
        // if (!context && !argument) this.callbacks.push([callback]);
        this.callbacks.push([callback, context, argument]);
        return this;
    } 

    /**
     *
     * @param delay
     * @param callback
     * @param context
     * @param argument
     */
    waitUntil(delay: number, callback: Function, context?: T, argument?: (any[] | any)): SimRequest<T> {
        if (this.noRenege) return this;
    
        const ro: SimRequest<T> = this._addRequest(this.scheduledAt + delay, callback, context!, argument);
        if (this.entity instanceof Entity) this.entity.sim.queue.insert(ro);
        return this;
    }

    /**
     *
     * @param event
     * @param callback
     * @param context
     * @param argument
     */
    unlessEvent(event: (SimEvent | SimEvent[]), callback: Function, context?: T, argument?: (any[] | any)): SimRequest<T> {
        if (this.noRenege) return this;
    
        if (event instanceof SimEvent) {
            const ro: SimRequest<T> = this._addRequest(0, callback, context!, argument);
            ro.msg = event;
            event.addWaitList(ro);
    
        } else if (event instanceof Array) {
            for (let i = 0; i < event.length; i++) {
                const ro: SimRequest<T> = this._addRequest(0, callback, context!, argument);
                ro.msg = event[i];
                event[i].addWaitList(ro);
            }
        }
    
        return this;
    }

    /**
     *
     * @param data
     */
    setData(data: any): SimRequest<T> {
        this.data = data;
        return this;
    }

    /**
     *
     */
    deliver(): void {
        if (this.cancelled) return;
        this.cancel();
        if (!this.callbacks) return;
    
        if (this.group && this.group.length > 0) {
            this._doCallback(this.group[0].source,
                this.msg,
                this.group[0].data);
        } else {
            this._doCallback(this.source,
                this.msg,
                this.data);
        }
    }

    /**
     *
     */
    cancelRenegeClauses(): void {
        this.noRenege = true;

        if (!this.group || this.group[0] != this) {
            return;
        }

        for (let i = 1; i < this.group.length; i++) {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0 && this.entity instanceof Entity) {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    }

    /**
     *
     */
    Null(): SimRequest<T> {
        return this;
    }

    /**
     *
     * @param deliverAt
     * @param callback
     * @param context
     * @param argument
     */
    private _addRequest(deliverAt: number, callback: Function, context: T, argument: (any[] | any)): SimRequest<T> {
        const ro = new SimRequest<T>(
            this.entity,
            this.scheduledAt,
            deliverAt);
    
        ro.callbacks.push([callback, context, argument]);
    
        if (this.group === null) {
            this.group = [this];
        }
    
        this.group.push(ro);
        ro.group = this.group;
        return ro;
    }

    /**
     *
     * @param source
     * @param msg
     * @param data
     */
    private _doCallback(source: any, msg: any, data: any): void {
        for (let i = 0; i < this.callbacks.length; i++) {
            const callback: Function = this.callbacks[i][0];
            if (!callback) continue;
    
            let context: any = this.callbacks[i][1];
            if (!context) context = this.entity;
    
            const argument: (any[] | any) = this.callbacks[i][2];
    
            context.callbackSource = source;
            context.callbackMessage = msg;
            context.callbackData = data;
    
            if (!argument) {
                callback.call(context);
            } else if (argument instanceof Array) {
                callback.apply(context, argument);
            } else {
                callback.call(context, argument);
            }
    
            context.callbackSource = null;
            context.callbackMessage = null;
            context.callbackData = null;
        }
    }
}

export {
    SimRequest,
};
