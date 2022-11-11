/**
 * Random.js library.
 * 
 * The code is licensed as LGPL.
 */

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
 */
class Random {
    LOG4: number = Math.log(4.0);
    SG_MAGICCONST: number = 1.0 + Math.log(4.5);

    /* Period parameters */
    N = 624;
    M = 397;
    MATRIX_A = 0x9908b0df; /* constant vector a */
    UPPER_MASK = 0x80000000; /* most significant w-r bits */
    LOWER_MASK = 0x7fffffff; /* least significant r bits */

    mt: any[] = new Array(this.N);
    mti: number = this.N + 1; /* mti==N+1 means mt[N] is not initialized */


    pythonCompatibility: any;
    skip: any;
    lastNormal: any;

    /**
     *
     * @param seed
     */
    constructor(seed: number) {
        seed = (seed === undefined) ? (new Date()).getTime() : seed;
        if (Math.ceil(seed) != Math.floor(seed)) { 
            throw new TypeError('seed value must be an integer'); 
        }
        
        // this.init_genrand(seed);
        this.init_by_array([seed], 1);
    }

    /**
     *
     * @param s
     */
    init_genrand(s: number): void {
        this.mt[0] = s >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
                + this.mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            this.mt[this.mti] >>>= 0;
            /* for >32 bit machines */
        }
    }

    /* initialize by an array with array-length */
    /* init_key is the array for initializing keys */
    /* key_length is its length */
    /* slight change for C++, 2004/2/26 */
    /**
     *
     * @param init_key
     * @param key_length
     */
    init_by_array(init_key: number[], key_length: number): void {
        let i, j, k;
        this.init_genrand(19650218);
        i = 1; j = 0;
        k = (this.N > key_length ? this.N : key_length);
        for (; k; k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
                + init_key[j] + j; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++; j++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
            if (j >= key_length)
                j = 0;
        }
        for (k = this.N - 1; k; k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
                - i; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
        }

        this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
    }

    /** generates a random number on [0,0xffffffff]-interval */
    genrand_int32(): number {
        let y;
        const mag01 = [0x0, this.MATRIX_A];
        /* mag01[x] = x * MATRIX_A  for x=0,1 */
        if (this.mti >= this.N) { /* generate N words at one time */
            let kk;

            if (this.mti == this.N + 1) /* if init_genrand() has not been called, */
                this.init_genrand(5489); /* a default initial seed is used */

            for (kk = 0; kk < this.N - this.M; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < this.N - 1; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return y >>> 0;
    }

    /** generates a random number on [0,0x7fffffff]-interval */
    genrand_int31(): number {
        return (this.genrand_int32() >>> 1);
    }
    /** generates a random number on [0,1]-real-interval */
    genrand_real1(): number {
        return this.genrand_int32() * (1.0 / 4294967295.0);
        /* divided by 2^32-1 */
    }
    /** generates a random number on [0,1)-real-interval */
    random(): number {
        if (this.pythonCompatibility) {
            if (this.skip) {
                this.genrand_int32();
            }
            this.skip = true;
        }
        return this.genrand_int32() * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }
    /** generates a random number on (0,1)-real-interval */
    genrand_real3(): number {
        return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }
    /** generates a random number on [0,1) with 53-bit resolution*/
    genrand_res53(): number {
        const a = this.genrand_int32() >>> 5, b = this.genrand_int32() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }
    /**
     *
     * @param lambda
     */
    exponential(lambda: number): number {
        const r = this.random();
        return -Math.log(r) / lambda;
    }
    /**
     *
     * @param alpha
     * @param beta
     */
    gamma(alpha: number, beta: number): number {
        /* Based on Python 2.6 source code of random.py.
         */
        if (alpha > 1.0) {
            const ainv = Math.sqrt(2.0 * alpha - 1.0);
            const bbb = alpha - this.LOG4;
            const ccc = alpha + ainv;
            while (true) {
                const u1 = this.random();
                if ((u1 < 1e-7) || (u! > 0.9999999)) {
                    continue;
                }
                const u2 = 1.0 - this.random();
                const v = Math.log(u1 / (1.0 - u1)) / ainv;
                const x = alpha * Math.exp(v);
                const z = u1 * u1 * u2;
                const r = bbb + ccc * v - x;
                if ((r + this.SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= Math.log(z))) {
                    return x * beta;
                }
            }
        } else if (alpha == 1.0) {
            var u = this.random();
            while (u <= 1e-7) {
                u = this.random();
            }
            return -Math.log(u) * beta;
        } else {
            while (true) {
                var u = this.random();
                const b = (Math.E + alpha) / Math.E;
                const p = b * u;
                if (p <= 1.0) {
                    var x = Math.pow(p, 1.0 / alpha);
                } else {
                    var x = -Math.log((b - p) / alpha);
                }
                const u1 = this.random();
                if (p > 1.0) {
                    if (u1 <= Math.pow(x, (alpha - 1.0))) {
                        break;
                    }
                } else if (u1 <= Math.exp(-x)) {
                    break;
                }
            }
            return x * beta;
        }
    }
    /**
     *
     * @param mu
     * @param sigma
     */
    normal(mu: number, sigma: number): number {
        let z = this.lastNormal;
        this.lastNormal = NaN;
        if (!z) {
            const a = this.random() * 2 * Math.PI;
            const b = Math.sqrt(-2.0 * Math.log(1.0 - this.random()));
            z = Math.cos(a) * b;
            this.lastNormal = Math.sin(a) * b;
        }
        return mu + z * sigma;
    }
    /**
     *
     * @param alpha
     */
    pareto(alpha: number): number {
        const u = this.random();
        return 1.0 / Math.pow((1 - u), 1.0 / alpha);
    }
    /**
     *
     * @param lower
     * @param upper
     * @param mode
     */
    triangular(lower: number, upper: number, mode: number): number {
        // http://en.wikipedia.org/wiki/Triangular_distribution
        const c = (mode - lower) / (upper - lower);
        const u = this.random();

        if (u <= c) {
            return lower + Math.sqrt(u * (upper - lower) * (mode - lower));
        } else {
            return upper - Math.sqrt((1 - u) * (upper - lower) * (upper - mode));
        }
    }
    /**
     *
     * @param lower
     * @param upper
     */
    uniform(lower: number, upper: number): number {
        return lower + this.random() * (upper - lower);
    }
    /**
     *
     * @param alpha
     * @param beta
     */
    weibull(alpha: number, beta: number): number {
        const u = 1.0 - this.random();
        return alpha * Math.pow(-Math.log(u), 1.0 / beta);
    }
}

export {
    Random,
};
