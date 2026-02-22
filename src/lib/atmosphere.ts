

const Density: number[] = [1.0, -9.59387e-5, 3.53118e-9, -5.83556e-14, 2.28719e-19];
const Pressure: number[] = [1.0, -0.000118441, 5.6763e-9, -1.3738e-13, 1.60373e-18];
const Temperature: number[] = [1.0, -2.27712e-5, 2.18069e-10, -5.71104e-14, 3.97306e-18];

const stdP0: number = 101300.0;    // Standard pressure at sea level, Pa
const stdT0: number = 288.16;      // Standard temperature at sea level, K
const stdRo0: number = 1.225;      // Standard density [kg/m3] t=15`C, p=760 mm/1013 gPa

function poly(tab: number[], v: number): number {
    return (((tab[4] * v + tab[3]) * v + tab[2]) * v + tab[1]) * v + tab[0];
}

export class Atmosphere {
    private g: number = 9.81;           // Earth gravity
    private P0: number = 101300.0;      // Pressure at sea level, Pa
    private T0: number = 288.16;        // Temperature at sea level, K
    private ro0: number = 1.225;        // Density [kg/m3] t=15`C, p=760 mm/1013 gPa
    private Mu0: number = 1.825e-6;     // Viscosity [Pa*sec]
    private hMax: number = 18300.0;     // Maximal altitude
    private water_density: number = 1000.0;

    private calcDensity0(): void {
        this.ro0 = 1.225 * (this.P0 / 101300.0) * (288.16 / this.T0);
    }

    public set(pressure: number, temperature: number): void {
        // pressure *= 101300.0 / 760.0;    // [Pa] , [N/m2]
        // temperature += 273.16;           // scale of Kelvin

        this.P0 = pressure;
        this.T0 = temperature;
        this.calcDensity0();
    }

    public reset(): void {
        this.P0 = stdP0;
        this.T0 = stdT0;
        this.ro0 = stdRo0;
    }

    public pressure(h: number): number {
        return this.P0 * poly(Pressure, Math.min(h, this.hMax)) * (this.hMax / Math.max(this.hMax, h));
    }

    public temperature(h: number): number {
        return this.T0 * poly(Temperature, Math.min(h, this.hMax));
    }

    public sonicSpeed(h: number): number {
        return 20.1 * Math.pow(this.temperature(h), 0.5);
    }

    public density(h: number): number {
        return this.ro0 * poly(Density, Math.min(h, this.hMax)) * (this.hMax / Math.max(this.hMax, h));
    }

    public viscosity(h: number): number {
        return this.Mu0 * Math.pow(this.temperature(h) / this.T0, 0.76);
    }

    public kinematicViscosity(h: number): number {
        return this.viscosity(h) / this.density(h);
    }

    public tas_from_ias(ias: number, h: number): number {
        return ias * Math.pow((1.225 / this.density(h)), 1 / 2);
    }
    public ram_effect(h: number, tas: number , intake_efficiency: number): number {
        let dynamic_pressure = (((this.density(h) * Math.pow((tas / 3.6), 2)) / 2) * intake_efficiency);
        console.log(dynamic_pressure, this.pressure(h))
        let ram_alt = Math.round(this.altitudeFromPressure((dynamic_pressure + this.pressure(h)), 0.1, h));
        return ram_alt;
    }

    public altitudeFromPressure(targetPressure: number, tolerance: number = 0.0001, startAltitude: number = 0): number {
        // Handle very low pressures like in C++ implementation
        const pressureAtHmax = this.P0 * poly(Pressure, this.hMax);
        if (targetPressure < pressureAtHmax) {
            return pressureAtHmax * this.hMax / Math.max(targetPressure, 1.0e-5);
        }

        // Newton's method implementation
        let arg = startAltitude;
        const maxSteps = 10;
        const deltaArg = tolerance; // Small step for derivative calculation

        for (let i = 0; i < maxSteps; i++) {
            // Calculate current value
            const currentPressure = this.P0 * poly(Pressure, arg) - targetPressure;
            
            // Calculate derivative
            const nextPressure = this.P0 * poly(Pressure, arg + deltaArg) - targetPressure;
            const derivative = (nextPressure - currentPressure) / deltaArg;
            
            // Check if derivative is too small
            if (Math.abs(derivative) < 1e-10) {
                return arg;
            }

            // Newton step
            const correction = -currentPressure / derivative;
            arg += correction;

            // Check if we're close enough
            if (Math.abs(correction) < tolerance) {
                return arg;
            }
        }

        return arg;
    }
    public altitudeFromPressure_simple(targetPressure: number): number {
            return (1 - Math.pow(targetPressure, 1 / 5.25588)) * (1 / 0.0000225577);
        }
}

export function calc_mach(tas: number, temperature: number): number {
    const kSpecifcHeat: number = 1.4;
    const gasConstant: number = 287.053;
    return tas / Math.pow(kSpecifcHeat * gasConstant * temperature, 0.5);
}

export function calc_tas(mach: number, temperature: number): number {
    const kSpecifcHeat: number = 1.4;
    const gasConstant: number = 287.053;
    return mach * Math.pow(kSpecifcHeat * gasConstant * temperature, 0.5);
}

    // public altitudeFromDensity(targetDensity: number, tolerance: number = 0.0001, startAltitude: number = 0): number {
    //     // Handle very low densities like in C++ implementation
    //     const densityAtHmax = this.ro0 * poly(Density, this.hMax);
    //     if (targetDensity < densityAtHmax) {
    //         return densityAtHmax * this.hMax / Math.max(targetDensity, 1.0e-5);
    //     }

    //     // Newton's method implementation
    //     let arg = startAltitude;
    //     const maxSteps = 10;
    //     const deltaArg = 0.1; // Small step for derivative calculation

    //     for (let i = 0; i < maxSteps; i++) {
    //         // Calculate current value
    //         const currentDensity = this.ro0 * poly(Density, arg) - targetDensity;
            
    //         // Calculate derivative
    //         const nextDensity = this.ro0 * poly(Density, arg + deltaArg) - targetDensity;
    //         const derivative = (nextDensity - currentDensity) / deltaArg;
            
    //         // Check if derivative is too small
    //         if (Math.abs(derivative) < 1e-10) {
    //             return arg;
    //         }

    //         // Newton step
    //         const correction = -currentDensity / derivative;
    //         arg += correction;

    //         // Check if we're close enough
    //         if (Math.abs(correction) < tolerance) {
    //             return arg;
    //         }
    //     }

    //     return arg;
    // }