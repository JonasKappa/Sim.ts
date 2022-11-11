/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */
import { Entity } from './Entity';
import { SimPopulation } from './SimPopulation';
import { SimQueue } from './SimQueue';
import { SimRequest } from './SimRequest';

class SimBuffer {

    name: string;
    capacity: number;
    available: number;
    putQueue: SimQueue<SimRequest<Entity>>;
    getQueue: SimQueue<SimRequest<Entity>>;

    /**
     *
     * @param name
     * @param capacity
     * @param initial
     */
    constructor(name: string, capacity: number, initial?: number) {
        this.name = name;
        this.capacity = capacity;
        this.available = (initial === undefined) ? 0 : initial;
        this.putQueue = new SimQueue();
        this.getQueue = new SimQueue();
    }

    /**
     *
     */
    current(): number {
        return this.available;
    }

    /**
     *
     */
    size(): number {
        return this.capacity;
    }

    percentage(): number {
        return (this.available * 100) / this.capacity;
    }

    /**
     *
     * @param amount
     * @param ro
     */
    get(amount: number, ro: SimRequest<Entity>): void {
        if (this.getQueue.empty()
            && amount <= this.available) {
            this.available -= amount;
    
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
    
            this.getQueue.passby(ro.deliverAt);
    
            this.progressPutQueue();
    
            return;
        }
        ro.amount = amount;
        this.getQueue.push(ro, ro.entity.time());
    }

    /**
     *
     * @param amount
     * @param ro
     */
    put(amount: number, ro: SimRequest<Entity>): void {
        if (this.putQueue.empty()
            && (amount + this.available) <= this.capacity) {
            this.available += amount;
    
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
    
            this.putQueue.passby(ro.deliverAt);
    
            this.progressGetQueue();
    
            return;
        }
    
        ro.amount = amount;
        this.putQueue.push(ro, ro.entity.time());
    }

    /**
     *
     */
    private progressGetQueue(): void {
        let obj;
        while (obj = this.getQueue.top()) {
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.getQueue.shift(obj.entity.time());
                continue;
            }
    
            // see if this request can be satisfied
            if (obj.amount <= this.available) {
                // remove it..
                this.getQueue.shift(obj.entity.time());
                this.available -= obj.amount;
                obj.deliverAt = obj.entity.time();
                obj.entity.sim.queue.insert(obj);
            } else {
                // this request cannot be satisfied
                break;
            }
        }
    }

    /**
     *
     */
    private progressPutQueue(): void {
        let obj;
        while (obj = this.putQueue.top()) {
            // if obj is cancelled.. remove it.
            if (obj.cancelled) {
                this.putQueue.shift(obj.entity.time());
                continue;
            }
    
            // see if this request can be satisfied
            if (obj.amount + this.available <= this.capacity) {
                // remove it..
                this.putQueue.shift(obj.entity.time());
                this.available += obj.amount;
                obj.deliverAt = obj.entity.time();
                obj.entity.sim.queue.insert(obj);
            } else {
                // this request cannot be satisfied
                break;
            }
        }
    }

    /**
     *
     */
    putStats(): SimPopulation {
        return this.putQueue.stats;
    }

    /**
     *
     */
    getStats(): SimPopulation {
        return this.getQueue.stats;
    }
}

export {
    SimBuffer,
};
