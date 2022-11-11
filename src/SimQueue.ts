/**
 * Author: Jonas Kappa (jkappa@gmx.de)
 * License: LGPL
 */
import { SimPopulation } from './SimPopulation';
import { SimRequest } from './SimRequest';

/**
 * Queues
 * 
 * This module provides:
 * - First in first out queue
 * - Last in first out queue
 * - Priority Queue
 */
class SimQueue<T> {

    name: string;
    data: T[] = [];
    timestamp: number[] = [];
    stats: SimPopulation = new SimPopulation();

    /**
     *
     * @param name
     */
    constructor(name?: string) {
        this.name = name || 'SimQueue';
    }

    /**
     *
     */
    top(): T {
        return this.data[0];
    }

    /**
     *
     */
    back(): T | undefined {
        return (this.data.length) ? this.data[this.data.length - 1] : undefined;
    }

    /**
     *
     * @param value
     * @param timestamp
     */
    push(value: T, timestamp: number): void {
        this.data.push(value);
        this.timestamp.push(timestamp);
        this.stats.enter(timestamp);
    }

    /**
     *
     * @param value
     * @param timestamp
     */
    unshift(value: T, timestamp: number): void {
        this.data.unshift(value);
        this.timestamp.unshift(timestamp);
        this.stats.enter(timestamp);
    }

    /**
     *
     * @param timestamp
     */
    shift(timestamp: number): T {
        const value: T = this.data.shift()!;
        const enqueuedAt: number = this.timestamp.shift()!;
        this.stats.leave(enqueuedAt, timestamp);
        return value;
    }

    /**
     *
     * @param timestamp
     */
    pop(timestamp: number): T {
        const value: T = this.data.pop()!;
        const enqueuedAt: number = this.timestamp.pop()!;
        this.stats.leave(enqueuedAt, timestamp);
        return value;
    }

    /**
     *
     * @param timestamp
     */
    passby(timestamp: number): void {
        this.stats.enter(timestamp);
        this.stats.leave(timestamp, timestamp);
    }

    /**
     *
     * @param timestamp
     */
    finalize(timestamp: number): void {
        this.stats.finalize(timestamp);
    }

    /**
     *
     */
    reset(): void {
        this.stats.reset();
    }

    /**
     *
     */
    clear(): void {
        this.reset();
        this.data = [];
        this.timestamp = [];
    }

    /**
     *
     */
    report(): [number, number] {
        return [this.stats.sizeSeries.average(),
            this.stats.durationSeries.average()];
    }

    /**
     *
     */
    empty(): boolean {
        return this.data.length == 0;
    }

    /**
     *
     */
    size(): number {
        return this.data.length;
    }
}

class SimPQueue {
    data: SimRequest<any>[] = [];
    order = 0;

    /**
     *
     * @param ro1
     * @param ro2
     */
    greater(ro1: SimRequest<any>, ro2: SimRequest<any>): boolean {
        if (ro1.deliverAt > ro2.deliverAt) return true;
        if (ro1.deliverAt == ro2.deliverAt)
            return ro1.order > ro2.order;
        return false;
    }

    /**
     *
     */
    getTop(): SimRequest<any> {
        return this.data[0];
    }

    /**
     * Root at index 0
     * 
     * Parent (i) = Math.floor((i-1) / 2)
     * 
     * Left (i) = 2i + 1
     * 
     * Right (i) = 2i + 2
     * @param ro
     */
    insert(ro: SimRequest<any>): void {
        ro.order = this.order++;
    
        let index = this.data.length;
        this.data.push(ro);
    
        // insert into data at the end
        const a = this.data;
        const node = a[index];
    
        // heap up
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.greater(a[parentIndex], ro)) {
                a[index] = a[parentIndex];
                index = parentIndex;
            } else {
                break;
            }
        }
        a[index] = node;
    }

    /**
     *
     */
    remove(): SimRequest<any> | undefined {
        const a = this.data;
        let len = a.length;
        if (len <= 0) {
            return undefined;
        }
        if (len == 1) {
            return this.data.pop();
        }
        const top = a[0];
        // move the last node up
        a[0] = a.pop()!;
        len--;
    
        // heap down
        let index = 0;
        const node = a[index];
    
        while (index < Math.floor(len / 2)) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
    
            const smallerChildIndex = rightChildIndex < len
                && !this.greater(a[rightChildIndex], a[leftChildIndex])
                ? rightChildIndex : leftChildIndex;
    
            if (this.greater(a[smallerChildIndex], node)) {
                break;
            }
    
            a[index] = a[smallerChildIndex];
            index = smallerChildIndex;
        }
        a[index] = node;
        return top;
    }
}

export {
    SimQueue, SimPQueue,
};
