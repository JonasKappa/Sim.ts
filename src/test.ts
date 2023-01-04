import { Entity } from "./Entity";
import { Sim } from "./Sim";
import { SimBuffer } from "./SimBuffer";
import { SimFacility } from "./SimFacility";
import { formatTime } from "./Util";

interface SimulationOptions {
    cashierTime: number;
    meanArrival: number;
    preparationTime: number;
    seed: number;
    buffetCapacity: number;
    simtime: number;
    realtime: boolean;
    timestepDuration?: number;
}

/**
 * Creates a Simulation Model and runs it
 * @param options Options needed for the simulation
 */
async function simulation(options: SimulationOptions): Promise<void> {
    const seed = options.seed;
    const simtime = options.simtime;
    const sim = new Sim(seed);
    sim.timeStepDuration = options.timestepDuration || 1000;
    const cashier = new SimFacility();
    const buffet = new SimBuffer('Buffet', options.buffetCapacity);
    const chef = new Chef(buffet, options.preparationTime);
    const customer = new Customer(buffet, cashier, options.meanArrival, options.cashierTime);

    sim.addEntity(chef);
    sim.addEntity(customer);

    sim.setLogger((msg: string) => {
        console.log(msg);
    });

    await sim.simulate({ endTime: simtime, realTime: options.realtime, logDate: true, date: {dateTimeObject:{year: 1998, month: 12, day: 10, hour: 23, minute: 57, second: 0, millisecond: 0}} });
    const stats = customer.getStats();
    console.log(`
Durchschnittliche Wartezeit:            ${(stats.durationSeries.average() / 60).toFixed(2)} min 
Standardabweichung Wartezeit:           ${(stats.durationSeries.deviation() / 60).toFixed(2)} min
Durchschnittliche Warteschlangenlänge:  ${stats.sizeSeries.average().toFixed(2)}
Standardabweichung Warteschlangenlänge: ${stats.sizeSeries.deviation().toFixed(2)}
Maximale Warteschlangenlänge:           ${stats.sizeSeries.max()}
Simulationszeit:                        ${formatTime(sim.totalSimulationTime)}
`);
}

class Chef extends Entity {
    public name = 'Chef';
    private buffet: SimBuffer;
    private preparationTime: number;

    /**
     *
     * @param buffet The buffer to use as the buffet
     * @param preparationTime The time needed to fill up the buffet
     */
    constructor(buffet: SimBuffer, preparationTime: number) {
        super();
        this.buffet = buffet;
        this.preparationTime = preparationTime;
    }

    /**
     *
     */
    public start(): void {
        this.putBuffer(this.buffet, this.buffet.capacity - this.buffet.current());
        this.setTimer(this.preparationTime).done(() => this.start());
    }
}

class Customer extends Entity {
    public name = 'Customer';
    private meanArrival: number;
    private cashierTime: number;
    private buffet: SimBuffer;
    private cashier: SimFacility;

    /**
     *
     * @param buffet The buffet to use
     * @param cashier The fcashier to use
     * @param meanArrival The mean time between customer arrival
     * @param cashierTime The mean time the cashier needs to fullfill the service
     */
    constructor(buffet: SimBuffer, cashier: SimFacility, meanArrival: number, cashierTime: number) {
        super();
        this.meanArrival = meanArrival;
        this.buffet = buffet;
        this.cashier = cashier;
        this.cashierTime = cashierTime;
    }

    /**
     *
     */
    public start(): void {
        this.order();

        const nextCustomerAt = this.random.exponential(1.0 / this.meanArrival);
        this.setTimer(nextCustomerAt).done(() => this.start());
    }

    /**
     *
     */
    private order(): void {
        this.log(`Customer ENTER at ${this.logTime()}`);
        this.stats.enter(this.time());

        this.getBuffer(this.buffet, 1)
            .done(() => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                this.log(`Customer at CASHIER ${this.logTime()} (entered at ${this.callbackData.logTime})`);

                const serviceTime = this.random.exponential(1.0 / this.cashierTime);
                this.useFacility(this.cashier, serviceTime)
                    .done(() => {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        this.log(`Customer LEAVE at ${this.logTime()} (entered at ${this.callbackData.logTime})`);
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        this.stats.leave(this.callbackData.time, this.time());
                    })
                    .setData(this.callbackData);
            })
            .setData({time: this.time(), logTime: this.logTime()});
    }
}

simulation({
    seed: 1234,
    realtime: false,
    simtime: 1 * 60 * 60,
    timestepDuration: 1000,
    buffetCapacity: 10,
    cashierTime: 15,
    meanArrival: 40,
    preparationTime: 5 * 60,
}).then((res) => {
    console.log('done');
}).catch((err) => {
    console.log(err);
})
