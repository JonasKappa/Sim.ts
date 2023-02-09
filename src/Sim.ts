/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */

import { DateTime } from "luxon";
import { Entity } from "./Entity";
import { Random } from "./Random";
import { SimPQueue } from "./SimQueue";
import { SimRequest } from "./SimRequest";

interface DateTimeObject {
    year?: number;
    month?: number;
    day?: number;
    ordinal?: number;
    weekyear?: number;
    weekNumber?: number;
    weekday?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
}

interface DateTimeOpts {
    zone?: string;
    locale?: string;
    outputCalendar?: string;
    numberingSystem?: string;
}

interface DateOpts {
    dateTimeObject?: DateTimeObject;
    dateTimeOpts?: DateTimeOpts;
}

interface SimOptions {
    endTime: number;
    date?: DateOpts;
    dateStep?: number;
    maxEvents?: number;
    realTime?: boolean;
    logDate?: boolean;
}

interface LoggableEntity {
    name?: string;
    id: number;
}

/**
 * Simulator Class
 */
class Sim {
    name = "Simulation";
    id = 0;
    /** Current Time of Simulation */
    simTime = -1;
    /** Current date and time in the simulation */
    currentDate: DateTime;
    /** Base date and time for calculation of the current date */
    baseDate: DateTime;
    /** The time the date increases for every step (ms)*/
    dateStep = 1000;
    /** The time a second in the simulation should last in real time (ms) */
    timeStepDuration = 1000;
    /** The entities in the simulation */
    entities: Entity[];
    /** A queue of requests */
    queue: SimPQueue = new SimPQueue();
    /** The end time of th simulation */
    endTime = 0;
    /** Running id of entities */
    entityId = 1;
    /** PART OF API - USAGE UNKNOWN */
    source: any;
    /** PART OF API - USAGE UNKNOWN */
    msg: any;
    /** Additional data */
    data: any;
    startSimulationTime!: number;
    totalSimulationTime!: number;
    logger!: (...args: any[]) => void;
    logDate = false;
    random: Random;
    dateTimeSet = false;

    /**
     *
     * @param seed
     * @param dateTime
     */
    constructor(seed: number) {
        this.random = new Random(seed);
        this.entities = [];
        this.currentDate = DateTime.now();
        this.baseDate = DateTime.fromISO(this.currentDate.toISO());
    }

    setDateTime(dateTime: DateTime): void {
        this.dateTimeSet = true;
        this.baseDate = DateTime.fromISO(dateTime.toISO());
        this.currentDate = DateTime.fromISO(dateTime.toISO());
    }

    /**
     *
     * @returns The current simTime
     */
    time(): number {
        return Math.max(0, this.simTime);
    }

    /**
     * Sends a `this.msg` from `this.source` to entities within `this.data`.
     * If `this.data` is undefined then send it to every entity in the simulation
     */
    sendMessage(): void {
        const sender = this.source;
        const message = this.msg;
        const entities = this.data;
        const sim = sender.sim;

        if (!entities) {
            // send to all entities
            for (let i = sim.entities.length - 1; i >= 0; i--) {
                const entity = sim.entities[i];
                if (entity === sender) continue;
                if (entity.onMessage)
                    entity.onMessage.call(entity, sender, message);
            }
        } else if (entities instanceof Array) {
            for (let i = entities.length - 1; i >= 0; i--) {
                const entity = entities[i];
                if (entity === sender) continue;
                if (entity.onMessage)
                    entity.onMessage.call(entity, sender, message);
            }
        } else {
            if (entities.onMessage) {
                entities.onMessage.call(entities, sender, message);
            }
        }
    }

    /**
     * Creates an entity from a IProto object, adds it to the sim,
     * runs the start method of the entity and returns the entity
     * @param entity An object which should be added to the sim
     * @param {...any} args
     * @returns The created entity
     */
    addEntity(entity: Entity, ...args: any[]): Entity {
        entity.sim = this;
        entity.id = this.entityId++;
        entity.setRandom(this.random);
        this.entities.push(entity);

        if (args.length > 0) {
            entity.start.apply(entity, args);
        } else {
            entity.start();
        }
        return entity;
    }

    /**
     * Sleeps a given time
     * @param msec How long the sleep should be
     * @returns Returns a promise that will be fulfilled after the sleep
     */
    sleep(msec: number): Promise<void> {
        if (msec <= 0) return new Promise((resolve) => resolve());
        return new Promise((resolve) => setTimeout(resolve, msec));
    }

    /**
     *
     */
    nextEvents(): SimRequest<any>[] {
        const events: any[] = [];
        const firstEvent = this.queue.remove();
        if (firstEvent === undefined) return events;
        const deliverTime = firstEvent.deliverAt;
        events.push(firstEvent);
        while (this.queue.getTop() !== undefined) {
            if (this.queue.getTop().deliverAt === deliverTime)
                events.push(this.queue.remove());
            else break;
        }
        return events;
    }

    /**
     *
     * @param options
     */
    async simulate(options: SimOptions): Promise<boolean> {
        // ARG_CHECK(arguments, 1, 2);
        if (!options.endTime) return false;
        const endTime = options.endTime;
        const maxEvents = options.maxEvents || Infinity;
        const realTime = options.realTime || false;
        this.logDate = options.logDate || false;
        if (options.date) {
            this.baseDate = DateTime.fromObject(
                options.date.dateTimeObject
                    ? options.date.dateTimeObject
                    : { millisecond: 0 },
                options.date.dateTimeOpts ? options.date.dateTimeOpts : {}
            );
        } else if (!this.dateTimeSet) {
            this.baseDate = DateTime.now();
            this.baseDate.set({ millisecond: 0 });
        }
        this.currentDate = DateTime.fromISO(this.baseDate.toISO());
        this.simTime = 0;
        this.startSimulationTime = Date.now();
        let eventCount = 0;

        while (true) {
            const startStepTime = Date.now();
            const events = this.nextEvents();
            if (events.length <= 0) break;
            let cancel = false;
            const oldSimTime = this.simTime;
            innerLoop: for (let i = 0; i < events.length; i++) {
                const ro = events[i];
                if (cancel) continue innerLoop;
                eventCount++;
                if (eventCount > maxEvents) {
                    cancel = true;
                    continue innerLoop;
                }
                // Uh oh.. we are out of time now
                if (ro.deliverAt > endTime) {
                    cancel = true;
                    continue innerLoop;
                }
                // Advance simulation time
                if (ro.deliverAt !== this.simTime) {
                    this.simTime = ro.deliverAt;
                    this.currentDate = this.baseDate.plus(<DateTimeObject>{
                        millisecond: this.simTime * this.dateStep,
                    });
                }
                // If this event is already cancelled, ignore
                if (ro.cancelled) continue innerLoop;
                ro.deliver();
            }
            if (cancel) break;

            if (realTime) {
                const deltaSimTime = this.simTime - oldSimTime;
                const sleepTime =
                    this.timeStepDuration * deltaSimTime -
                    (Date.now() - startStepTime);
                if (sleepTime > 0) {
                    await this.sleep(sleepTime);
                }
            }
        }
        this.totalSimulationTime = Date.now() - this.startSimulationTime;
        this.finalize();
        return true;
    }

    /**
     *
     */
    stepEvent(): boolean {
        while (true) {
            const ro = this.queue.remove();
            if (!ro) return false;
            this.simTime = ro.deliverAt;
            if (ro.cancelled) continue;
            ro.deliver();
            break;
        }
        return true;
    }

    /**
     *
     */
    step(): number {
        const events = this.nextEvents();
        if (events.length <= 0) return 0;
        let eventCount = 0;
        events.forEach(function (ro) {
            ro.entity.sim.simTime = ro.deliverAt;
            if (ro.cancelled) return;
            eventCount++;
            ro.deliver();
        });
        if (eventCount <= 0) return this.step();
        else return eventCount;
    }

    /**
     *
     */
    finalize(): void {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].finalize) {
                this.entities[i].finalize!();
            }
        }
    }

    /**
     *
     * @param logger
     */
    setLogger(logger: (...args: any[]) => void): void {
        this.logger = logger;
    }

    /**
     *
     * @returns the current dateTime object
     */
    getDateTime(): DateTime {
        return this.currentDate;
    }

    /**
     *
     * @returns formatted dateTime with format `dd.LL.y HH:mm:ss.SSS` --> `05.01.2019 14:06:59.021`
     */
    getFormattedDateTime(): string {
        return this.currentDate.toFormat("dd.LL.y HH:mm:ss.SSS");
    }

    getLogTime(): string {
        if (this.logDate) {
            if (this.simTime >= 0) return this.getFormattedDateTime();
        } else if (this.simTime >= 0) return this.simTime.toFixed(6);
        return "";
    }

    /**
     *
     * @param message
     * @param entity
     */
    log(message: string, entity?: LoggableEntity): void {
        if (!this.logger) return;
        let entityMsg = "";
        if (entity !== undefined) {
            if (entity.name) {
                entityMsg = "[" + entity.name + "]";
            } else {
                entityMsg = "[" + entity.id + "]";
            }
        }
        let timestamp = this.getLogTime() + " ";
        if (this.simTime < 0) {
            timestamp = timestamp.slice(0, -1);
        }
        this.logger(timestamp + entityMsg + " " + message);
    }
}

export {
    Sim,
    SimOptions,
    LoggableEntity,
    DateOpts,
    DateTimeObject,
    DateTimeOpts,
};
