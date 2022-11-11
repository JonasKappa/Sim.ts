
/**
 * DataSeries
 * 
 * Mean and letiance algorithm from Wikipedia
 * http://en.wikipedia.org/wiki/Standard_deviation#Rapid_calculation_methods
 */
class SimDataSeries {

    name: string;

    Count!: number;
    W!: number;
    A!: number;
    Q!: number;
    Max!: number;
    Min!: number;
    Sum!: number;

    histogram: number[] | null = null;
    hLower!: number;
    hUpper!: number;
    hBucketSize!: number;

    /**
     *
     * @param name
     */
    constructor(name?: string) {
        this.name = name || 'SimDataSeries';
        this.reset();
    }

    /**
     *
     */
    reset(): void {
        this.Count = 0;
        this.W = 0.0;
        this.A = 0.0;
        this.Q = 0.0;
        this.Max = -Infinity;
        this.Min = Infinity;
        this.Sum = 0;
    
        if (this.histogram) {
            for (let i = 0; i < this.histogram.length; i++) {
                this.histogram[i] = 0;
            }
        }
    }

    /**
     *
     * @param lower
     * @param upper
     * @param nbuckets
     */
    setHistogram(lower: number, upper: number, nbuckets: number): void {
        this.hLower = lower;
        this.hUpper = upper;
        this.hBucketSize = (upper - lower) / nbuckets;
        this.histogram = new Array(nbuckets + 2);
        for (let i = 0; i < this.histogram.length; i++) {
            this.histogram[i] = 0;
        }
    }

    /**
     *
     */
    getHistogram(): number[] {
        return this.histogram!;
    }

    /**
     *
     * @param value
     * @param weight
     */
    record(value: number, weight?: number): void {
        const w = (weight === undefined) ? 1 : weight;
    
        if (value > this.Max) this.Max = value;
        if (value < this.Min) this.Min = value;
        this.Sum += value;
        this.Count++;
        if (this.histogram) {
            if (value < this.hLower) {
                this.histogram[0] += w;
            }
            else if (value > this.hUpper) {
                this.histogram[this.histogram.length - 1] += w;
            } else {
                const index = Math.floor((value - this.hLower) / this.hBucketSize) + 1;
                this.histogram[index] += w;
            }
        }
    
        this.W = this.W + w;
    
        if (this.W === 0) {
            return;
        }

        const lastA = this.A;
        this.A = lastA + (w / this.W) * (value - lastA);
    
        this.Q = this.Q + w * (value - lastA) * (value - this.A);
    }

    /**
     *
     */
    count(): number {
        return this.Count;
    }
    
    /**
     *
     */
    min(): number {
        return this.Min;
    }
    
    /**
     *
     */
    max(): number {
        return this.Max;
    }
    
    /**
     *
     */
    range(): number {
        return this.Max - this.Min;
    }
    
    /**
     *
     */
    sum(): number {
        return this.Sum;
    }

    /**
     *
     */
    sumWeighted(): number {
        return this.A * this.W;
    }
    
    /**
     *
     */
    average(): number {
        return this.A;
    }
    
    /**
     *
     */
    letiance(): number {
        return this.Q / this.W;
    }
    
    /**
     *
     */
    deviation(): number {
        return Math.sqrt(this.letiance());
    }
}

interface dataset {
    data: number[];
    labels: string[];
}

class SimTimeSeries {

    dataSeries: SimDataSeries;
    dataset: dataset = {
        data: [], labels: [],
    };
    lastValue!: number;
    lastTimestamp!: number;
    
    /**
     *
     * @param name
     */
    constructor(name?: string) {
        this.dataSeries = new SimDataSeries(name);
    }

    /**
     *
     */
    reset(): void {
        this.dataSeries.reset();
        this.lastValue = NaN;
        this.lastTimestamp = NaN;
    }

    /**
     *
     * @param lower
     * @param upper
     * @param nbuckets
     */
    setHistogram(lower: number, upper: number, nbuckets: number): void {
        this.dataSeries.setHistogram(lower, upper, nbuckets);
    }

    /**
     *
     */
    getHistogram(): number[] {
        return this.dataSeries.getHistogram();
    }

    /**
     *
     * @param value
     * @param timestamp
     */
    record(value: number, timestamp: number): void {
        if (!isNaN(this.lastTimestamp)) {
            this.dataSeries.record(this.lastValue, timestamp - this.lastTimestamp);
        }
    
        this.lastValue = value;
        this.lastTimestamp = timestamp;

        this.dataset.data.push(value);
        this.dataset.labels.push(timestamp.toString());
    }

    /**
     *
     * @param timestamp
     */
    finalize(timestamp: number): void {
        this.record(this.lastValue, timestamp);
    }

    /**
     *
     */
    count(): number {
        return this.dataSeries.count();
    }
    
    /**
     *
     */
    min(): number {
        return this.dataSeries.min();
    }
    
    /**
     *
     */
    max(): number {
        return this.dataSeries.max();
    }
    
    /**
     *
     */
    range(): number {
        return this.dataSeries.range();
    }
    
    /**
     *
     */
    sum(): number {
        return this.dataSeries.sum();
    }
    
    /**
     *
     */
    average(): number {
        return this.dataSeries.average();
    }
    
    /**
     *
     */
    deviation(): number {
        return this.dataSeries.deviation();
    }
    
    /**
     *
     */
    letiance(): number {
        return this.dataSeries.letiance();
    }

}

export {
    SimDataSeries, SimTimeSeries,
};
