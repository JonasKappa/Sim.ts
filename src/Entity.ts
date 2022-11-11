/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */
import { Random } from './Random';
import { Sim } from './Sim';
import { SimBuffer } from './SimBuffer';
import { SimEvent } from './SimEvent';
import { SimFacility } from './SimFacility';
import { SimPopulation } from './SimPopulation';
import { SimRequest } from './SimRequest';
import { SimStore } from './SimStore';

interface Entity {
    finalize?: () => void;
}

abstract class Entity {
    public sim!: Sim;
    public id!: number;
    protected random!: Random;
    public name!: string;
    public stats: SimPopulation = new SimPopulation();
    public abstract start(...args: any[]): void;

    // for callbacks
    public callbackSource: any = null;
    public callbackMessage: any = null;
    public callbackData: any = null;

    /**
     *
     */
    getStats(): SimPopulation {
        return this.stats;
    }

    /**
     *
     */
    time(): number {
        return this.sim.time();
    }

    /**
     * 
     * @param random 
     */
    public setRandom(random: Random): void {
        this.random = random;
    }

    /**
     *
     * @param duration
     */
    setTimer(duration: number): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(
            this,
            this.time(),
            this.time() + duration);

        this.sim.queue.insert(ro);
        return ro;
    }

    /**
     *
     * @param event
     */
    waitEvent(event: SimEvent): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.time(), 0);

        ro.source = event;
        event.addWaitList(ro);
        return ro;
    }

    /**
     *
     * @param event
     */
    queueEvent(event: SimEvent): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);

        ro.source = event;
        event.addQueue(ro);
        return ro;
    }

    /**
     *
     * @param facility
     * @param duration
     */
    useFacility(facility: SimFacility, duration: number): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);
        ro.source = facility;
        facility.use(duration, ro);
        return ro;
    }

    /**
     *
     * @param buffer
     * @param amount
     */
    putBuffer(buffer: SimBuffer, amount: number): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);
        ro.source = buffer;
        buffer.put(amount, ro);
        return ro;
    }

    /**
     *
     * @param buffer
     * @param amount
     */
    getBuffer(buffer: SimBuffer, amount: number): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);
        ro.source = buffer;
        buffer.get(amount, ro);
        return ro;
    }

    /**
     *
     * @param store
     * @param obj
     */
    putStore(store: SimStore<any>, obj: any): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);
        ro.source = store;
        store.put(obj, ro);
        return ro;
    }

    /**
     *
     * @param store
     * @param filter
     */
    getStore(store: SimStore<any>, filter: (every: any) => boolean): SimRequest<Entity> {
        const ro: SimRequest<Entity> = new SimRequest(this, this.sim.time(), 0);
        ro.source = store;
        store.get(filter, ro);
        return ro;
    }

    /**
     *
     * @param message
     * @param delay
     * @param entities
     */
    send(message: any, delay: number, entities: Entity[]): void {
        const ro: SimRequest<Sim> = new SimRequest(this.sim, this.time(), this.time() + delay);
        ro.source = this;
        ro.msg = message;
        ro.data = entities;
        ro.deliver = this.sim.sendMessage;

        this.sim.queue.insert(ro);
    }

    /**
     *
     * @param message
     */
    log(message: string) {
        this.sim.log(message, this);
    }
}


export {
    Entity,
};
