import { SimRequest } from './SimRequest';

class SimEvent {
    
    name: string;
    waitList: SimRequest<any>[] = [];
    queue: SimRequest<any>[] = [];
    isFired = false;

    /**
     *
     * @param name
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     *
     * @param ro
     */
    addWaitList(ro: SimRequest<any>): void {
        if (this.isFired) {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.waitList.push(ro);
    }

    /**
     *
     * @param ro
     */
    addQueue(ro: SimRequest<any>): void {
        if (this.isFired) {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.queue.push(ro);
    }

    /**
     *
     * @param keepFired
     */
    fire(keepFired: boolean): void {
        if (keepFired) {
            this.isFired = true;
        }
    
        // Dispatch all waiting entities
        const tmpList: SimRequest<any>[] = this.waitList;
        this.waitList = [];
        for (let i = 0; i < tmpList.length; i++) {
            tmpList[i].deliver();
        }
    
        // Dispatch one queued entity
        const lucky: SimRequest<any> = this.queue.shift()!;
        if (lucky) {
            lucky.deliver();
        }
    }

    /**
     *
     */
    clear(): void {
        this.isFired = false;
    }
}

export {
    SimEvent,
};
