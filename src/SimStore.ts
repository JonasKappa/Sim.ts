/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */
import { Entity } from './Entity';
import { SimPopulation } from './SimPopulation';
import { SimQueue } from './SimQueue';
import { SimRequest } from './SimRequest';

class SimStore<T> {
    name: string;
    capacity: number;
    objects: T[] = [];
    putQueue: SimQueue<SimRequest<Entity>> = new SimQueue();
    getQueue: SimQueue<SimRequest<Entity>> = new SimQueue();
    available = 0;

    /**
     *
     * @param name
     * @param capacity
     */
    constructor(name: string, capacity: number) {
        this.name = name;
        this.capacity = capacity;
    }

    /**
     *
     */
    current(): number {
        return this.objects.length;
    }

    /**
     *
     */
    size(): number {
        return this.capacity;
    }

    /**
     *
     * @param filter
     * @param ro
     */
    get(filter: (obj: T) => boolean, ro: SimRequest<Entity>) {
        if (this.getQueue.empty() && this.current() > 0) {
            let found = false;
            let obj;
            // it is repeated in progressGetQueue
            if (filter) {
                for (let i = 0; i < this.objects.length; i++) {
                    obj = this.objects[i];
                    if (filter(obj)) {
                        found = true;
                        this.objects.splice(i, 1);
                        break;
                    }
                }
            } else {
                obj = this.objects.shift();
                found = true;
            }
    
            if (found) {
                this.available--;
    
                ro.msg = obj;
                ro.deliverAt = ro.entity.time();
                ro.entity.sim.queue.insert(ro);
    
                this.getQueue.passby(ro.deliverAt);
    
                this.progressPutQueue();
    
                return;
            }
        }
    
        ro.filter = filter;
        this.getQueue.push(ro, ro.entity.time());
    }

    /**
     *
     * @param obj
     * @param ro
     */
    put(obj: T, ro: SimRequest<Entity>) {
        if (this.putQueue.empty() && this.current() < this.capacity) {
            this.available++;
    
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
    
            this.putQueue.passby(ro.deliverAt);
            this.objects.push(obj);
    
            this.progressGetQueue();
    
            return;
        }
    
        ro.obj = obj;
        this.putQueue.push(ro, ro.entity.time());
    }

    /**
     *
     */
    progressGetQueue(): void {
        let ro;
        while (ro = this.getQueue.top()) {
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.getQueue.shift(ro.entity.time());
                continue;
            }
    
            // see if this request can be satisfied
            if (this.current() > 0) {
                const filter = ro.filter;
                let found = false;
                let obj;
    
                if (filter) {
                    for (let i = 0; i < this.objects.length; i++) {
                        obj = this.objects[i];
                        if (filter(obj)) {
                            found = true;
                            this.objects.splice(i, 1);
                            break;
                        }
                    }
                } else {
                    obj = this.objects.shift();
                    found = true;
                }
    
                if (found) {
                    // remove it..
                    this.getQueue.shift(ro.entity.time());
                    this.available--;
    
                    ro.msg = obj;
                    ro.deliverAt = ro.entity.time();
                    ro.entity.sim.queue.insert(ro);
                } else {
                    break;
                }
    
            } else {
                // this request cannot be satisfied
                break;
            }
        }
    }

    /**
     *
     */
    progressPutQueue(): void {
        let ro;
        while (ro = this.putQueue.top()) {
            // if obj is cancelled.. remove it.
            if (ro.cancelled) {
                this.putQueue.shift(ro.entity.time());
                continue;
            }
    
            // see if this request can be satisfied
            if (this.current() < this.capacity) {
                // remove it..
                this.putQueue.shift(ro.entity.time());
                this.available++;
                this.objects.push(ro.obj);
                ro.deliverAt = ro.entity.time();
                ro.entity.sim.queue.insert(ro);
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
    SimStore,
};
