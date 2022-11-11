import { Entity } from './Entity';
import { SimPopulation } from './SimPopulation';
import { SimQueue } from './SimQueue';
import { SimRequest } from './SimRequest';

enum SimFacilityDiscipline {
    FCFS,
    LCFS
}

/**
 * Facility
 *
 * Scheduling disciplines: 
 * 	- FCFS
 *  - Infinite servers // subcase of FCFS: servers = Infinity. IMM
 *  - Last come, first served, preempt: IMM
 *  - Processor sharing: IMM
 *  - Round robin, with time slice: NOT IMM
 *  
 *  Priority Based:
 *   - Preempt, resume: NOT IMM
 *   - Preempt, restart: NOT IMM
 *   - Round robin with priority: NOT IMM
 */
class SimFacility {
    static NumDisciplines = 4;

    free: number;
    servers: number;
    maxqlen: number;
    use: (duration: number, ro: SimRequest<Entity>) => void;
    queue: SimQueue<SimRequest<Entity>>;
    freeServers!: any[];
    stats: SimPopulation = new SimPopulation();
    busyDuration = 0;
    currentRO!: SimRequest<Entity> | null;
    lastIssued!: number;

    callbackSource: any;
    callbackMessage: any;
    callbackData: any;

    /**
     *
     * @param discipline
     * @param servers
     * @param maxqlen
     */
    constructor(discipline?: SimFacilityDiscipline, servers?: number, maxqlen?: number) {
        this.free = servers ? servers : 1;
        this.servers = servers ? servers : 1;
        this.maxqlen = (maxqlen === undefined) ? -1 : 1 * maxqlen;
    
        switch (discipline) {
            case SimFacilityDiscipline.LCFS:
                this.use = this.useLCFS;
                this.queue = new SimQueue();
                break;
            case SimFacilityDiscipline.FCFS:
            default:
                this.use = this.useFCFS;
                this.freeServers = new Array(this.servers);
                this.queue = new SimQueue();
                for (let i = 0; i < this.freeServers.length; i++) {
                    this.freeServers[i] = true;
                }
        }
    }

    /**
     *
     */
    reset(): void {
        this.queue.reset();
        this.stats.reset();
        this.busyDuration = 0;
    }

    /**
     *
     */
    systemStats(): SimPopulation {
        return this.stats;
    }

    /**
     *
     */
    queueStats(): SimPopulation {
        return this.queue.stats;
    }

    /**
     *
     */
    usage(): number {
        return this.busyDuration;
    }

    /**
     *
     * @param timestamp
     */
    finalize(timestamp: number): void {
        this.stats.finalize(timestamp);
        this.queue.stats.finalize(timestamp);
    } 

    /**
     *
     * @param duration
     * @param ro
     */
    useFCFS(duration: number, ro: SimRequest<Entity>): void {
        if ((this.maxqlen === 0 && !this.free)
            || (this.maxqlen > 0 && this.queue.size() >= this.maxqlen)) {
            ro.msg = -1;
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
    
        ro.duration = duration;
        const now = ro.entity.time();
        this.stats.enter(now);
        this.queue.push(ro, now);
        this.useFCFSSchedule(now);
    }

    /**
     *
     * @param timestamp
     */
    useFCFSSchedule(timestamp: number): void {
        while (this.free > 0 && !this.queue.empty()) {
            const ro = this.queue.shift(timestamp); // TODO
            if (ro.cancelled) {
                continue;
            }
            for (let i = 0; i < this.freeServers.length; i++) {
                if (this.freeServers[i]) {
                    this.freeServers[i] = false;
                    ro.msg = i;
                    break;
                }
            }
    
            this.free--;
            this.busyDuration += ro.duration;
    
            // cancel all other reneging requests
            ro.cancelRenegeClauses();
    
            const newro: SimRequest<SimFacility> = new SimRequest(this, timestamp, timestamp + ro.duration);
            newro.done(this.useFCFSCallback, this, ro);
    
            ro.entity.sim.queue.insert(newro);
        }
    }

    /**
     *
     * @param ro
     */
    useFCFSCallback(ro: SimRequest<Entity>): void {
        // We have one more free server
        this.free++;
        this.freeServers[ro.msg] = true;

        this.stats.leave(ro.scheduledAt, ro.entity.time());

        // if there is someone waiting, schedule it now
        this.useFCFSSchedule(ro.entity.time());

        // restore the deliver function, and deliver
        ro.deliver();
    }

    /**
     *
     * @param duration
     * @param ro
     */
    useLCFS(duration: number, ro: SimRequest<Entity>) {
        // if there was a running request..
        if (this.currentRO) {
            this.busyDuration += (this.currentRO.entity.time() - this.currentRO.lastIssued);
            // calcuate the remaining time
            this.currentRO.remaining =
                (this.currentRO.deliverAt - this.currentRO.entity.time());
            // preempt it..
            this.queue.push(this.currentRO, ro.entity.time());
        }
    
        this.currentRO = ro;
        // If this is the first time..
        if (!ro.saved_deliver) {
            ro.cancelRenegeClauses();
            ro.remaining = duration;
            ro.saved_deliver = ro.deliver;
            ro.deliver = this.useLCFSCallback;
    
            this.stats.enter(ro.entity.time());
        }
    
        ro.lastIssued = ro.entity.time();
    
        // schedule this new event
        ro.deliverAt = ro.entity.time() + duration;
        ro.entity.sim.queue.insert(ro);
    }

    useLCFSCallback = function(this: SimRequest<Entity>): void {
        const ro: SimRequest<Entity> = this;
        const facility: SimFacility = ro.source;
    
        if (ro != facility.currentRO) return;
        facility.currentRO = null;
    
        // stats
        facility.busyDuration += (ro.entity.time() - ro.lastIssued);
        facility.stats.leave(ro.scheduledAt, ro.entity.time());
    
        // deliver this request
        ro.deliver = ro.saved_deliver!;
        delete ro.saved_deliver;
        ro.deliver();
    
        // see if there are pending requests
        if (!facility.queue.empty()) {
            const obj = facility.queue.pop(ro.entity.time());
            facility.useLCFS(obj.remaining, obj);
        }
    };
}

export {
    SimFacility, SimFacilityDiscipline,
};
