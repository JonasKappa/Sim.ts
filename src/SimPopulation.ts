import { SimDataSeries, SimTimeSeries } from './SimSeries';

class SimPopulation {
    
    name: string;
    population = 0;
    sizeSeries: SimTimeSeries = new SimTimeSeries();
    durationSeries: SimDataSeries = new SimDataSeries();
    
    /**
     *
     * @param name
     */
    constructor(name?: string) {
        this.name = name || 'SimPopulation';
    }

    /**
     *
     */
    reset(): void {
        this.sizeSeries.reset();
        this.durationSeries.reset();
        this.population = 0;
    }

    /**
     *
     * @param timestamp
     */
    enter(timestamp: number): void {
        this.population++;
        this.sizeSeries.record(this.population, timestamp);
    }

    /**
     *
     * @param arrivalAt
     * @param leftAt
     */
    leave(arrivalAt: number, leftAt: number): void {
        this.population--;
        this.sizeSeries.record(this.population, leftAt);
        this.durationSeries.record(leftAt - arrivalAt);
    }

    /**
     *
     */
    current(): number {
        return this.population;
    }
    
    /**
     *
     * @param timestamp
     */
    finalize(timestamp: number): void {
        this.sizeSeries.finalize(timestamp);
    }
}

export {
    SimPopulation,
};
