export function dict_dataframer(named_power_curves_merged: NamedPowerCurves, alt_unit: string): DataFrameRow[] {
    let altitudeValues: number[] = [];
    let enginePowerData: { [planeName: string]: number[] } = {};

    // Iterate over each plane
    for (let planeName in named_power_curves_merged) {
        let powerCurvesMerged = named_power_curves_merged[planeName];
        let enginePowerValues: number[] = [];

        // Iterate over altitude values for each plane's power curve
        for (let altitudeStr in powerCurvesMerged.WEP) {
            let altitude = Number(altitudeStr);

            // Store altitude values
            if (!altitudeValues.includes(altitude)) {
                altitudeValues.push(altitude);
            }

            // Store engine power values for each plane
            enginePowerValues.push(powerCurvesMerged.WEP[altitudeStr]);
        }

        // Store engine power values for the current plane
        enginePowerData[planeName] = enginePowerValues;
    }

    // Sort altitude values
    altitudeValues.sort((a, b) => a - b);

    // Construct final data frame rows
    let finalData: DataFrameRow[] = [];
    finalData.push({ 'Altitude [m]': altitudeValues });

    // Add engine power data for each plane
    for (let planeName in enginePowerData) {
        finalData.push({ [planeName]: enginePowerData[planeName] });
    }

    return finalData;
}