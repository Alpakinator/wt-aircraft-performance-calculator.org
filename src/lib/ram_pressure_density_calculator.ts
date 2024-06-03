export function air_pressurer(alt) {
    /**
     * Calculates air pressure at a given altitude
     * based on www.engineeringtoolbox.com
     * @param {number} alt - Altitude
     * @returns {number} - Air pressure
     */
    return Math.pow((1 - 0.0000225577 * alt), 5.25588);
}

export function altitude_at_pressurer(air_pressure) {
    /**
     * Calculates altitude given air pressure
     * Inverse of 'air_pressure' function
     * @param {number} air_pressure - Air pressure
     * @returns {number} - Altitude
     */
    return (1 - Math.pow(air_pressure, 1 / 5.25588)) * (1 / 0.0000225577);
}

export function air_densitier(air_pressure, air_temp, alt) {
    /**
     * Calculates air density given its pressure and temperature
     * 291.127 R_specific was empirically calculated to match the output of
     * https://www.calctool.org/atmospheric-thermodynamics/air-density
     * @param {number} air_pressure - Air pressure
     * @param {number} air_temp - Air temperature
     * @param {number} alt - Altitude
     * @returns {number} - Air density
     */
    let air_temp_at_alt = air_temp - (0.0065 * alt);
    const R_specific = 287.0500676;
    return (101325 * air_pressure) / ((273.15 + air_temp_at_alt) * R_specific);
}

export function ias_tas_er(speed, air_density) {
    /**
     * Calculates TAS based on IAS and air density
     * 0.72 used to be 1.225
     * @param {number} speed - IAS speed
     * @param {number} air_density - Air density
     * @returns {number} - TAS speed
     */
    return speed * Math.pow((1.225 / air_density), 1 / 2);
}

export function rameffect_er(alt, air_temp, speed, speed_type, Compressor) {
    /**
     * Based on air RAM effect and alt, calculates equivalent altitude with no RAM effect
     * where total air pressure is identical
     * @param {number} alt - Altitude
     * @param {number} air_temp - Air temperature
     * @param {number} speed - Speed
     * @param {string} speed_type - Speed type (IAS or TAS)
     * @param {object} Compressor - Compressor object containing SpeedManifoldMultiplier - efficiency of ram effect
     * @returns {number} - Equivalent altitude with no RAM effect
     */
    
    let air_pressure = air_pressurer(alt);
    let air_density_val = air_densitier(air_pressure, air_temp, alt);
    let TASspeed;

    if (speed === 0) {
        return alt;
    } else if (speed_type === "IAS") {
        TASspeed = ias_tas_er(speed, air_density_val);
    } else {
        TASspeed = speed;
    }
    let dynamic_pressure = (((air_density_val * Math.pow((TASspeed / 3.6), 2)) / 2) * Compressor) / 101325;
    
    let total_pressure = air_pressure + dynamic_pressure;
    
    let alt_RAM = Math.round(altitude_at_pressurer(total_pressure));
    return alt_RAM;
}
