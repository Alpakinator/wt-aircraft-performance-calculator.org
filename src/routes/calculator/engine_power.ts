import { Atmosphere } from '$lib/atmosphere';

const atm = new Atmosphere();

function interpolatePowerOnAlt(lower_alt, lower_power, higher_alt, higher_power, h, curvature) {
	let power =
		lower_power +
		(higher_power - lower_power) *
			((atm.pressure(h) - atm.pressure(lower_alt)) /
				(atm.pressure(higher_alt) - atm.pressure(lower_alt))) **
				curvature;
	return power;
}

function interpolatePowerOnPressure(
	lower_press,
	lower_power,
	higher_press,
	higher_power,
	press,
	curvature
) {
	let power =
		lower_power +
		(higher_power - lower_power) *
			((press - lower_press) / (higher_press - lower_press)) ** curvature;
	return power;
}

export function createPressureMatrix(
	atm: Atmosphere,
	intake_efficiency: number,
	rows: number,
	cols: number
): number[][] {
	// Create array of arrays structure (speed → altitude)
	// Each outer array element represents a specific airspeed
	// Each inner array contains pressures at different altitudes for that airspeed
	const matrix: number[][] = Array(cols)
		.fill(0)
		.map(() => Array(rows).fill(0));

	// Precompute and convert speeds to m/s
	const tasValues = Array.from({ length: cols }, (_, col) => (col * 10) / 3.6);
	// console.log('tasValues', tasValues);
	// Cache altitude-based calculations
	const pressureCache: { [key: number]: number } = {};

	// For each altitude
	for (let row = 0; row < rows; row++) {
		const h = row * 20;

		const density = atm.density(h);

		// Get or calculate static pressure
		if (!(h in pressureCache)) {
			pressureCache[h] = atm.pressure(h);
		}
		const pressure = pressureCache[h];

		// For each airspeed
		for (let col = 0; col < cols; col++) {
			const tasSquared = Math.pow(tasValues[col], 2);
			const dynamic_pressure = ((density * tasSquared) / 2) * intake_efficiency;

			// console.log(tasValues[col], density)

			// Store in the matrix by [airspeed][altitude]
			matrix[col][row] = dynamic_pressure + pressure;
		}
	}

	return matrix;
}

// Process a single engine's power matrix
function createPowerMatrixSingleEngine(
	engineIntervals: any,
	pressure_matrix: number[][],
	rows: number,
	cols: number,
	engineIndex: number = 0
): { engine: number; mode: string; matrix: number[][] }[] {
	const result: { engine: number; mode: string; matrix: number[][] }[] = [];

	// Get all power modes from first gear (they're the same for all gears)
	const powerModes = Object.keys(engineIntervals[0] || {});

	// For each power mode
	for (const mode of powerModes) {
		// Create a new power matrix for this engine and power mode
		// Structure: [speed][altitude]
		const powerMatrix: number[][] = Array(cols)
			.fill(0)
			.map(() => Array(rows).fill(0));

		// Pre-compute some values for better performance
		const gearCount = engineIntervals.length;

		// For each airspeed
		for (let col = 0; col < cols; col++) {
			// For each altitude
			for (let row = 0; row < rows; row++) {
				const pressure = pressure_matrix[col][row];

				let maxPower = 0;

				// Find max power across all gears at this pressure
				for (let g = 0; g < gearCount; g++) {
					const intervals_for_gear = engineIntervals[g][mode];
					if (!intervals_for_gear || intervals_for_gear.length < 2) continue;

					// Find power for this pressure
					let power = findPowerForPressure(intervals_for_gear, pressure);
					maxPower = Math.max(maxPower, power);
				}

				powerMatrix[col][row] = maxPower;
			}
		}

		// Add this matrix to the result
		result.push({
			engine: engineIndex,
			mode: mode,
			matrix: powerMatrix
		});
	}

	return result;
}

export function createPowerMatrix(
	intervals: any[],
	pressure_matrix: number[][],
	rows: number,
	cols: number
): { engine: number; mode: string; matrix: number[][] }[] {
	// If we have a single engine or identical engines, just process once
	if (intervals.length === 1) {
		return createPowerMatrixSingleEngine(intervals[0], pressure_matrix, rows, cols);
	}

	// For multiple different engines, process each separately and combine results
	let result: { engine: number; mode: string; matrix: number[][] }[] = [];

	for (let e = 0; e < intervals.length; e++) {
		const engineMatrices = createPowerMatrixSingleEngine(
			intervals[e],
			pressure_matrix,
			rows,
			cols,
			e
		);
		result = result.concat(engineMatrices);
	}

	return result;
}

export function createPowerMatrix_3D(
	intervals: any[],
	intake_efficiency: number,
	rows: number, // altitude steps
	cols: number, // speed steps
	temp_min: number = -50,
	temp_max: number = 50,
	temp_step: number = 5
): { temperature: number; engine: number; mode: string; matrix: number[][] }[] {
	// Create temperature array from min to max with given step
	const temperatures = [273, 283, 293];

	// Initialize the result array
	const result: { temperature: number; engine: number; mode: string; matrix: number[][] }[] = [];

	// For each temperature
	for (const temp of temperatures) {
		// Create a new Atmosphere instance with this temperature
		const atm = new Atmosphere();
		atm.set(101300.0, temp); // Set temperature, keep standard pressure

		// Generate pressure matrix for this temperature
		const pressure_matrix = createPressureMatrix(atm, intake_efficiency, rows, cols);

		// Generate power matrices for this temperature
		const power_matrices = createPowerMatrix(intervals, pressure_matrix, rows, cols);

		// Add temperature information to each matrix and add to result
		for (const item of power_matrices) {
			result.push({
				temperature: temp,
				engine: item.engine,
				mode: item.mode,
				matrix: item.matrix
			});
		}
	}

	return result;
}

// Helper function to find power for a given pressure using binary search
function findPowerForPressure(intervals: [number, number, number][], pressure: number): number {
	// // Handle edge cases
	// if (intervals.length < 2) return 0;

	// // If pressure is outside the range of intervals, extrapolate


	// if (pressure <= intervals[intervals.length - 1][0]) {
	// 	return 0; // Below minimum pressure (extreme altitude)
	// }

	// Binary search to find the interval
	let left = 0;
	let right = intervals.length - 2; // -2 because we need to access i+1
	
	if (pressure >= intervals[0][0]) {
		return interpolatePowerOnPressure(
				intervals[0][0], // lower_press
				intervals[0][1], // lower_power
				intervals[1][0], // higher_press
				intervals[1][1], // higher_power
				pressure, // current pressure
				intervals[0][2] // curvature
			); // Above maximum pressure (sea level)
	} else if (pressure <= intervals[intervals.length - 1][0]) {
		return interpolatePowerOnPressure(
				intervals[intervals.length - 2][0], // lower_press
				intervals[intervals.length - 2][1], // lower_power
				intervals[intervals.length - 1][0], // higher_press
				intervals[intervals.length - 1][1], // higher_power
				pressure, // current pressure
				intervals[intervals.length - 2][2] // curvature
			); // Below minimum pressure (extreme altitude)
	}
	while (left <= right) {
		const mid = Math.floor((left + right) / 2);

		const lowerPressure = intervals[mid][0];
		const higherPressure = intervals[mid + 1][0];

		if (pressure <= lowerPressure && pressure > higherPressure) {
			// Found our interval, calculate power
			return interpolatePowerOnPressure(
				intervals[mid][0], // lower_press
				intervals[mid][1], // lower_power
				intervals[mid + 1][0], // higher_press
				intervals[mid + 1][1], // higher_power
				pressure, // current pressure
				intervals[mid][2] // curvature
			);
		}

		if (pressure > lowerPressure) {
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}

	// If we get here, use linear interpolation between closest intervals
	for (let i = 0; i < intervals.length - 1; i++) {
		if (pressure <= intervals[i][0] && pressure > intervals[i + 1][0]) {
			return interpolatePowerOnPressure(
				intervals[i][0],
				intervals[i][1],
				intervals[i + 1][0],
				intervals[i + 1][1],
				pressure,
				intervals[i][2]
			);
		}
	}

	return 0; // Fallback
}

export function calculateEnginecount(fm_dict: { [key: string]: any }): [number, string[]] {
	// Determine which prefix to use based on existence of "EngineType0"
	const engine_key = 'EngineType0' in fm_dict ? 'EngineType' : 'Engine';
	// Find all keys starting with engine_key that end with digits
	const engine_keys = Object.keys(fm_dict).filter((k) => {
		if (!k.startsWith(engine_key)) return false;

		const suffix = k.substring(engine_key.length);
		// Check if suffix is a number using standard JS conversion
		return suffix.length > 0 && !isNaN(Number(suffix));
	});

	// If no engine keys found, return defaults
	if (engine_keys.length === 0) {
		return [1, []];
	}

	// Calculate max engine index and add 1 to get total count
	const engine_count = Math.max(
		...engine_keys.map((k) => parseInt(k.substring(engine_key.length), 10))
	);

	return [engine_count + 1, engine_keys];
}

function createFMshortcuts(
	fm_dict: { [key: string]: any },
	engine: string
): [
	{ [key: string]: any }, // Engine
	{ [key: string]: any }, // Compressor
	{ [key: string]: any }, // Main
	{ [key: string]: any }, // Modif
	boolean, // Afterburner (can be boolean or object)
	{ [key: string]: any } // Propeller
] {
	let Engine = fm_dict;
	let Compressor = fm_dict;
	let Main = fm_dict;
	let Modif = fm_dict;
	let Afterburner = false;
	if ('Compressor' in fm_dict[engine]) {
		Engine = fm_dict[engine];
		Compressor = fm_dict[engine].Compressor;
		Main = fm_dict[engine].Main;
		Afterburner = fm_dict[engine].Afterburner.IsControllable;
	}
	if ('Modif' in fm_dict) {
		Modif = fm_dict.Modif;
	}
	let Propeller: { [key: string]: any };
	if ('Propellor' in Engine) {
		Propeller = Engine.Propellor;
	} else {
		Propeller = Main;
	}

	return [Engine, Compressor, Main, Modif, Afterburner, Propeller];
}

function ConstRPM_is(Compressor: any, s: number): boolean {
	return `AltitudeConstRPM${s}` in Compressor && `PowerConstRPM${s}` in Compressor;
}

function Ceiling_is(Compressor: any, s: number): boolean {
	return `Ceiling${s}` in Compressor && `PowerAtCeiling${s}` in Compressor;
}

function Ceiling_is_useful(Compressor: any, s: number): boolean {
	if (!Ceiling_is(Compressor, s)) return false;
	if (Compressor[`Ceiling${s}`] - Compressor[`Altitude${s}`] < 2) return false;
	if (Compressor[`Power${s}`] - Compressor[`PowerAtCeiling${s}`] < 2) return false;
	return true;
}

function ConstRPM_bends_above_crit_alt(Compressor: any, s: number): boolean {
	if (!ConstRPM_is(Compressor, s)) return false;
	if (Compressor[`AltitudeConstRPM${s}`] !== Compressor[`Altitude${s}`]) return false;
	if (Compressor[`Power${s}`] - Compressor[`PowerAtCeiling${s}`] <= 1) return false;
	if (Compressor[`PowerConstRPMCurvature0`] <= 1) return false;
	return true;
}

function Power_is_deck_power(Main: any, Compressor: any, s: number): boolean {
	return Compressor[`Altitude${s}`] === Main[`Deck_Altitude${s}`];
}

function ConstRPM_bends_below_critalt(Compressor: any, s: number): boolean {
	if (!ConstRPM_is(Compressor, s)) return false;
	return Compressor[`AltitudeConstRPM${s}`] - Compressor[`Altitude${s}`] < -1;
}

function ConstRPM_bends_below_WEP_critalt(Main: any, Compressor: any, s: number): boolean {
	if (!ConstRPM_is(Compressor, s)) return false;
	return Compressor[`AltitudeConstRPM${s}`] - Main[`WEP_crit_altitude`] < -1;
}

function ConstRPM_is_below_deck(Compressor: any, s: number): boolean {
	if (!ConstRPM_is(Compressor, s)) return false;
	return Compressor[`AltitudeConstRPM${s}`] <= 0;
}

function ConstRPM_should_be_ignored_on_WEP(Main: any, Compressor: any, s: number): boolean {
	if (!ConstRPM_is(Compressor, s)) return false;

	const constRPMAlt = Number(Compressor[`AltitudeConstRPM${s}`]);
	const militaryCritAlt = Number(Compressor[`Altitude${s}`]);
	const wepCritAlt = Number(Main[`WEP_crit_altitude`]);

	if (!Number.isFinite(constRPMAlt) || !Number.isFinite(militaryCritAlt) || !Number.isFinite(wepCritAlt)) {
		return false;
	}

	return militaryCritAlt > constRPMAlt && wepCritAlt < constRPMAlt;
}

// Torquer function needs to be implemented
function calculateTorque(lowerRPM: number, higherRPM: number): number {
	const Torque_max_RPM = 0.75 * higherRPM;
	return (
		(higherRPM * (2 * Torque_max_RPM * higherRPM - higherRPM ** 2)) /
		(lowerRPM * (2 * Torque_max_RPM * lowerRPM - lowerRPM ** 2))
	);
}

function calculateBrrritishOctane(Modif: any, Main: any, octane: boolean): void {
	Main.OctaneAfterburnerMult = 1;

	if (!Modif) {
		return;
	}

	if ('150_octan_fuel' in Modif) {
		const octaneMod = Modif['150_octan_fuel'];

		if (!octaneMod.invertEnableLogic) {
			if (octane) {
				Main.OctaneAfterburnerMult = octaneMod.effects.afterburnerMult;
				Main.Octane_mp =
					Main.Mil_mp + (Main.WEP_mp - Main.Mil_mp) * octaneMod.effects.afterburnerCompressorMult;
			}
		} else {
			Main.WEP_mp =
				Main.Mil_mp + (Main.WEP_mp - Main.Mil_mp) * octaneMod.effects.afterburnerCompressorMult;
			Main.Octane_mp = Main.WEP_mp;

			if (!octane) {
				Main.OctaneAfterburnerMult = octaneMod.effects.afterburnerMult;
			}
		}
		return;
	}

	if ('100_octan_spitfire' in Modif && Modif['100_octan_spitfire'].invertEnableLogic) {
		const spitfireMod = Modif['100_octan_spitfire'];

		Main.WEP_mp =
			Main.Mil_mp + (Main.WEP_mp - Main.Mil_mp) * spitfireMod.effects.afterburnerCompressorMult;
		Main.Octane_mp = Main.WEP_mp;

		if (!octane) {
			Main.OctaneAfterburnerMult = spitfireMod.effects.afterburnerMult;
		}
	}
}

function calculateSovietOctane(Compressor: any, Main: any, Modif: any, s: number): void {
	if (!Modif) {
		return;
	}

	// Check if either fuel mod exists with the specific effect value
	const hasOctaneMod =
		Modif['ussr_fuel_b-95']?.effects?.addHorsePowers === 50 ||
		Modif['ussr_fuel_b-100']?.effects?.addHorsePowers === 50;

	if (!hasOctaneMod) {
		return;
	}

	// Use constant multiplier instead of calculating each time
	const universal_octane_modifier = 1.018;

	if (s === 0) {
		Main.Power *= universal_octane_modifier;
	}
	if (ConstRPM_is(Compressor, s)) {
		Compressor[`PowerConstRPM${s}`] = Compressor[`PowerConstRPM${s}`] * universal_octane_modifier;
	}
	Compressor[`Power${s}`] = Compressor[`Power${s}`] * universal_octane_modifier;
	if (Ceiling_is_useful(Compressor, s)) {
		Compressor[`PowerAtCeiling${s}`] = Compressor[`PowerAtCeiling${s}`] * universal_octane_modifier;
	}
}

function calculateWEPmult(
	Compressor: any,
	Main: any,
	s: number,
	octane: boolean,
	atm: Atmosphere
): number {
	// Initialize AfterburnerPressureBoost if not present
	if (!(`AfterburnerPressureBoost${s}` in Compressor)) {
		Compressor[`AfterburnerPressureBoost${s}`] = 1;
	}

	// Calculate supercharger strengths
	const deckAltitude = Main[`Deck_Altitude${s}`];
	const critAltitude = Compressor[`Altitude${s}`];

	Main[`deck_supercharger_strength${s}`] = (Main.Mil_mp * atm.P0) / atm.pressure(deckAltitude);
	Main.WEP_deck_supercharger_strength =
		Main[`deck_supercharger_strength${s}`] *
		Main.WEP_mil_RPM_EffectOnSupercharger *
		Compressor[`AfterburnerPressureBoost${s}`];

	Main[`crit_supercharger_strength${s}`] = (Main.Mil_mp * atm.P0) / atm.pressure(critAltitude);
	Main.WEP_crit_supercharger_strength =
		Main[`crit_supercharger_strength${s}`] *
		Main.WEP_mil_RPM_EffectOnSupercharger *
		Compressor[`AfterburnerPressureBoost${s}`];

	// Set WEP ceiling altitude
	Main.WEP_ceil_altitude =
		`Ceiling${s}` in Compressor && `PowerAtCeiling${s}` in Compressor
			? Compressor[`Ceiling${s}`]
			: 0;

	// Reset octane if Octane_mp is default
	if (Main.Octane_mp === 1) {
		octane = false;
	}

	// Calculate WEP altitudes based on octane setting
	const manifoldPressure = octane ? Main.Octane_mp : Main.WEP_mp;

	Main.WEP_deck_altitude = Math.round(
		atm.altitudeFromPressure((manifoldPressure * atm.P0) / Main.WEP_deck_supercharger_strength)
	);
	Main.WEP_crit_altitude = Math.round(
		atm.altitudeFromPressure((manifoldPressure * atm.P0) / Main.WEP_crit_supercharger_strength)
	);
	// console.log('wep_crit_alt', Main.WEP_crit_altitude, Main.WEP_crit_supercharger_strength);
	// Handle non-exact altitudes with ConstRPM
	if (!Compressor.ExactAltitudes && ConstRPM_is(Compressor, s)) {
		const constRPM_supercharger_strength =
			Main.Mil_mp / atm.pressure(Compressor[`AltitudeConstRPM${s}`]);

		Main.WEP_constRPM_supercharger_strength =
			constRPM_supercharger_strength *
			Main.WEP_mil_RPM_EffectOnSupercharger *
			Compressor[`AfterburnerPressureBoost${s}`];

		Main.WEP_powerconstRPM = atm.altitudeFromPressure(
			(manifoldPressure * atm.P0) / Main.WEP_constRPM_supercharger_strength
		);
	}

	// Calculate WEP power multiplier
	if (!(`AfterburnerBoostMul${s}` in Compressor)) {
		Compressor[`AfterburnerBoostMul${s}`] = 1;
	}

	Main.WEP_power_mult =
		(1 + (Main.AfterburnerBoost - 1) * Main.OctaneAfterburnerMult) *
		Main.ThrottleBoost *
		Compressor[`AfterburnerBoostMul${s}`] *
		calculateTorque(Main.Mil_rpm, Main.WEP_rpm);

	if (Compressor[`AfterburnerBoostMul${s}`] === 0) {
		Main.WEP_deck_altitude = 0;
		Main.WEP_crit_altitude = Compressor[`Altitude${s}`];
		Main.WEP_power_mult = 1;
	}
	return Main.WEP_power_mult;
}

function calculateInterval(
	Compressor: any,
	Main: any,
	s: number,
	mode: string,
	h: number
): [number, number, number, number, number] {
	let curvature: number = 1;
	let higher_alt: number = 0;
	let higher_power: number = 0;
	let lower_alt: number = 0;
	let lower_power: number = 0;
	if (mode === 'military') {
		// First altitude range
		if (h <= Compressor[`Altitude${s}`]) {
			const isConstRPM = ConstRPM_is(Compressor, s);
			// Attention to this one:
			if (
				isConstRPM &&
				ConstRPM_is_below_deck(Compressor, s) &&
				h < Compressor[`AltitudeConstRPM${s}`]
			) {
				higher_alt = Compressor[`Altitude${s}`];
				higher_power = Compressor[`Power${s}`];
				lower_alt = Compressor[`AltitudeConstRPM${s}`];
				lower_power = Compressor[`PowerConstRPM${s}`];
				return [lower_alt, lower_power, higher_alt, higher_power, curvature];
			}

			const bendsBelowCrit = ConstRPM_bends_below_critalt(Compressor, s);
			if (!bendsBelowCrit && !Power_is_deck_power(Main, Compressor, s)) {
				higher_alt = Compressor[`Altitude${s}`];
				higher_power = Compressor[`Power${s}`];
				lower_alt = Main[`Deck_Altitude${s}`];
				lower_power = Main[`Power${s}`];
			} else if (bendsBelowCrit) {
				if (h < Compressor[`AltitudeConstRPM${s}`]) {
					higher_alt = Compressor[`AltitudeConstRPM${s}`];
					higher_power = Compressor[`PowerConstRPM${s}`];
					lower_alt = Main[`Deck_Altitude${s}`];
					lower_power = Main[`Power${s}`];
				} else {
					curvature = Compressor[`PowerConstRPMCurvature${s}`];
					higher_alt = Compressor[`Altitude${s}`];
					higher_power = Compressor[`Power${s}`];
					lower_alt = Compressor[`AltitudeConstRPM${s}`];
					lower_power = Compressor[`PowerConstRPM${s}`];
				}
			} else if (Power_is_deck_power(Main, Compressor, s)) {
				higher_alt = Compressor[`Ceiling${s}`];
				higher_power = Compressor[`PowerAtCeiling${s}`];
				lower_alt = Compressor[`Altitude${s}`];
				lower_power = Compressor[`Power${s}`];
			}
			return [lower_alt, lower_power, higher_alt, higher_power, curvature];
		}

		// Second altitude range
		if (h <= Compressor[`Old_Altitude${s}`]) {
			lower_alt = Compressor[`Altitude${s}`];
			lower_power = Compressor[`Power${s}`];

			const isCeilingUseful = Ceiling_is_useful(Compressor, s);
			const bendsAboveCrit = ConstRPM_bends_above_crit_alt(Compressor, s);

			if (!isCeilingUseful) {
				higher_alt = Compressor[`Old_Altitude${s}`];
				higher_power =
					interpolatePowerOnAlt(
						Main[`Deck_Altitude${s}`],
						Main[`Power${s}`],
						Compressor[`Altitude${s}`],
						Compressor[`Old_Power_new_RPM${s}`],
						Compressor[`Altitude${s}`],
						curvature
					) *
					(atm.pressure(Compressor[`Old_Altitude${s}`]) / atm.pressure(Compressor[`Altitude${s}`]));
			} else {
				if (bendsAboveCrit) {
					curvature = Compressor[`PowerConstRPMCurvature${s}`];
				}

				if (Compressor.ExactAltitudes) {
					higher_alt = Compressor[`Old_Altitude${s}`];
					higher_power = interpolatePowerOnAlt(
						Compressor[`Altitude${s}`],
						Compressor[`Old_Power_new_RPM${s}`],
						Compressor[`Ceiling${s}`],
						Compressor[`PowerAtCeiling${s}`],
						Compressor[`Old_Altitude${s}`],
						curvature
					);
				} else {
					higher_alt = Compressor[`Ceiling${s}`];
					higher_power = Compressor[`PowerAtCeiling${s}`];
				}
			}
			return [lower_alt, lower_power, higher_alt, higher_power, curvature];
		}

		// Third altitude range
		const isCeilingUseful = Ceiling_is_useful(Compressor, s);
		if (!isCeilingUseful) {
			lower_alt = Compressor[`Old_Altitude${s}`];
			lower_power =
				interpolatePowerOnAlt(
					Main[`Deck_Altitude${s}`],
					Main[`Power${s}`],
					Compressor[`Altitude${s}`],
					Compressor[`Old_Power_new_RPM${s}`],
					Compressor[`Altitude${s}`],
					curvature
				) *
				(atm.pressure(Compressor[`Old_Altitude${s}`]) / atm.pressure(Compressor[`Altitude${s}`]));
			higher_alt = lower_alt + 1000;
			higher_power = lower_power * (atm.pressure(higher_alt) / atm.pressure(lower_alt));
		} else {
			const bendsAboveCrit = ConstRPM_bends_above_crit_alt(Compressor, s);
			if (bendsAboveCrit) {
				curvature = Compressor[`PowerConstRPMCurvature${s}`];
			}

			higher_alt = Compressor[`Ceiling${s}`];
			higher_power = Compressor[`PowerAtCeiling${s}`];

			if (Compressor.ExactAltitudes) {
				lower_alt = Compressor[`Old_Altitude${s}`];
				lower_power = interpolatePowerOnAlt(
					Compressor[`Altitude${s}`],
					Compressor[`Old_Power_new_RPM${s}`],
					Compressor[`Ceiling${s}`],
					Compressor[`PowerAtCeiling${s}`],
					Compressor[`Old_Altitude${s}`],
					curvature
				);
			} else {
				lower_alt = Compressor[`Old_Altitude${s}`];
				lower_power = Compressor[`Power${s}`];
			}
		}
		return [lower_alt, lower_power, higher_alt, higher_power, curvature];
	}
	// ############# ↑Military↑ ↓WEP↓ #############
	else if (mode === 'WEP') {
		const ignoreConstRPMOnWEP = ConstRPM_should_be_ignored_on_WEP(Main, Compressor, s);

		// First altitude range - below WEP critical altitude
		if (h <= Main[`WEP_crit_altitude`] && h <= Compressor[`Old_Altitude${s}`]) {
			const isConstRPM = ConstRPM_is(Compressor, s) && !ignoreConstRPMOnWEP;
			let whichever_is_lower = Main[`WEP_crit_altitude`];
			if (Main[`WEP_crit_altitude`] > Compressor[`Old_Altitude${s}`]){
				whichever_is_lower = Compressor[`Old_Altitude${s}`];
			}
			if (
				isConstRPM &&
				ConstRPM_is_below_deck(Compressor, s) &&
				h < Compressor[`AltitudeConstRPM${s}`]
			) {
				higher_alt = whichever_is_lower;
				higher_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
				lower_alt = Compressor[`AltitudeConstRPM${s}`];
				lower_power = Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`];
				return [lower_alt, lower_power, higher_alt, higher_power, curvature];
			}

			const bendsBelowCrit = !ignoreConstRPMOnWEP && ConstRPM_bends_below_critalt(Compressor, s);
			if (!bendsBelowCrit && !Power_is_deck_power(Main, Compressor, s)) {
				if (Compressor.ExactAltitudes) {
					
					higher_alt = whichever_is_lower;
					higher_power = interpolatePowerOnAlt(
						Main[`Deck_Altitude${s}`],
						Main[`Power${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						higher_alt,
						curvature
					);
					
					lower_alt = Main[`WEP_deck_altitude`];
					lower_power = interpolatePowerOnAlt(
						Main[`Deck_Altitude${s}`],
						Main[`Power${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						lower_alt,
						curvature
					);
				} else {
					
					higher_alt = whichever_is_lower;
					higher_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
					lower_alt = Main[`Deck_Altitude0`];
					lower_power = Main[`Power${s}`] * Main[`WEP_power_mult`];
				}
				
			} else if (
				!ignoreConstRPMOnWEP &&
				Compressor.ExactAltitudes &&
				h < Compressor[`AltitudeConstRPM${s}`]
			) {
				// console.log('works2', Main[`WEP_power_mult`]);
				higher_power = Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`];
				lower_alt = Main[`Deck_Altitude${s}`];
				lower_power = Main[`Power${s}`] * Main[`WEP_power_mult`];
				higher_alt = Compressor[`AltitudeConstRPM${s}`];
			} else if (
				!ignoreConstRPMOnWEP &&
				!Compressor.ExactAltitudes &&
				h < Main[`WEP_powerconstRPM`]
			) {
				higher_power = Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`];
				lower_alt = Main[`Deck_Altitude${s}`];
				lower_power = Main[`Power${s}`] * Main[`WEP_power_mult`];
				higher_alt = Main[`WEP_powerconstRPM`];
			} else if (
				!ignoreConstRPMOnWEP &&
				Compressor.ExactAltitudes &&
				h >= Compressor[`AltitudeConstRPM${s}`]
			) {
				curvature = Compressor[`PowerConstRPMCurvature${s}`];
				higher_alt = whichever_is_lower;
				lower_power = Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`];
				lower_alt = Compressor[`AltitudeConstRPM${s}`];
				higher_power = interpolatePowerOnAlt(
					Compressor[`AltitudeConstRPM${s}`],
					Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`],
					Compressor[`Altitude${s}`],
					Compressor[`Power${s}`] * Main[`WEP_power_mult`],
					higher_alt,
					curvature
				);
			} else if (
				!ignoreConstRPMOnWEP &&
				!Compressor.ExactAltitudes &&
				h >= Main[`WEP_powerconstRPM`]
			) {
				curvature = Compressor[`PowerConstRPMCurvature${s}`];
				higher_alt = whichever_is_lower;
				lower_power = Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`];
				lower_alt = Main[`WEP_powerconstRPM`];
				higher_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
			} else if (Power_is_deck_power(Main, Compressor, s)) {
				if (Compressor.ExactAltitudes) {
					higher_alt = Compressor[`Ceiling${s}`];
					const pressureRatio =
						atm.pressure(Main[`WEP_crit_altitude`]) / atm.pressure(Compressor[`Altitude${s}`]);
					higher_power = interpolatePowerOnAlt(
						Main[`WEP_crit_altitude`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						atm.altitudeFromPressure(atm.pressure(Compressor[`Ceiling${s}`]) * pressureRatio),
						Compressor[`PowerAtCeiling${s}`] * Main[`WEP_power_mult`],
						Compressor[`Ceiling${s}`],
						curvature
					);
				} else {
					higher_alt = Compressor[`Ceiling${s}`];
					higher_power = Compressor[`PowerAtCeiling${s}`];
					lower_alt = Main[`WEP_crit_altitude`];
					lower_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
				}
			}

			return [lower_alt, lower_power, higher_alt, higher_power, curvature];
		}
		// Second altitude range - between old altitude and WEP critical altitude
		if (Compressor[`Old_Altitude${s}`] < h && h <= Main[`WEP_crit_altitude`]) {
			higher_alt = Main[`WEP_crit_altitude`];
			higher_power = interpolatePowerOnAlt(
				Main[`Deck_Altitude${s}`],
				Main[`Power${s}`] * Main[`WEP_power_mult`],
				Compressor[`Altitude${s}`],
				Compressor[`Power${s}`] * Main[`WEP_power_mult`],
				Compressor[`Old_Altitude${s}`],
				curvature
			) ;
			lower_alt = Compressor[`Old_Altitude${s}`];
			lower_power = higher_power;
			return [lower_alt, lower_power, higher_alt, higher_power, curvature];
		}

		// Third altitude range - between WEP critical altitude and old altitude
		if (
			Math.round(Main[`WEP_crit_altitude`]) < h &&
			h <= Math.round(Compressor[`Old_Altitude${s}`])
		) {
			const bendsAboveCrit =
				!ignoreConstRPMOnWEP && ConstRPM_bends_above_crit_alt(Compressor, s);
			const isCeilingUseful = Ceiling_is_useful(Compressor, s);
			const bendsBelowWEPCrit =
				!ignoreConstRPMOnWEP && ConstRPM_bends_below_WEP_critalt(Main, Compressor, s);

			lower_alt = Main[`WEP_crit_altitude`];
			if (!bendsBelowWEPCrit) {

				if (Compressor.ExactAltitudes) {
					lower_power = interpolatePowerOnAlt(
						Main[`Deck_Altitude${s}`],
						Main[`Power${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						lower_alt,
						curvature
					);
				} else {
					lower_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
				}
			} else {
				if (Compressor.ExactAltitudes) {
					lower_power = interpolatePowerOnAlt(
						Compressor[`AltitudeConstRPM${s}`],
						Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						lower_alt,
						Compressor[`PowerConstRPMCurvature${s}`]
					);
				} else {
					lower_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
				}
			}

			if (!isCeilingUseful) {
				higher_alt = Compressor[`Old_Altitude${s}`];
				higher_power =
					interpolatePowerOnAlt(
						Main[`Deck_Altitude${s}`],
						Main[`Power${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						higher_alt,
						curvature
					) *
					(atm.pressure(Compressor[`Old_Altitude${s}`]) / atm.pressure(lower_alt));
			} else {
				if (bendsAboveCrit) {
					curvature = Compressor[`PowerConstRPMCurvature${s}`];
				}

				if (Compressor.ExactAltitudes) {
					higher_alt = Compressor[`Old_Altitude${s}`];
					const pressureRatio =
						atm.pressure(Main[`WEP_crit_altitude`]) / atm.pressure(Compressor[`Altitude${s}`]);
					higher_power = interpolatePowerOnAlt(
						Main[`WEP_crit_altitude`],
						Compressor[`Old_Power_new_RPM${s}`] * Main[`WEP_power_mult`],
						atm.altitudeFromPressure(atm.pressure(Compressor[`Ceiling${s}`]) * pressureRatio),
						Compressor[`PowerAtCeiling${s}`] * Main[`WEP_power_mult`],
						Compressor[`Old_Altitude${s}`],
						curvature
					);
				} else {
					higher_alt = Compressor[`Ceiling${s}`];
					higher_power = Compressor[`PowerAtCeiling${s}`];
				}
			}
			return [lower_alt, lower_power, higher_alt, higher_power, curvature];
		}

		// Fourth altitude range - above both old altitude and WEP critical altitude
		if (h > Compressor[`Old_Altitude${s}`] && h > Main[`WEP_crit_altitude`]) {
			if (Main[`WEP_crit_altitude`] < Compressor[`Altitude${s}`]) {
				lower_alt = Compressor[`Old_Altitude${s}`];
				const isCeilingUseful = Ceiling_is_useful(Compressor, s);

				if (!isCeilingUseful) {
					lower_power =
						interpolatePowerOnAlt(
							Main[`Deck_Altitude${s}`],
							Main[`Power${s}`] * Main[`WEP_power_mult`],
							Compressor[`Altitude${s}`],
							Compressor[`Power${s}`] * Main[`WEP_power_mult`],
							lower_alt,
							curvature
						) *
						(atm.pressure(Compressor[`Old_Altitude${s}`]) /
							atm.pressure(Main[`WEP_crit_altitude`]));
				} else if (Compressor.ExactAltitudes) {
					const pressureRatio =
						atm.pressure(Main[`WEP_crit_altitude`]) / atm.pressure(Compressor[`Altitude${s}`]);
					lower_power = interpolatePowerOnAlt(
						Main[`WEP_crit_altitude`],
						Compressor[`Old_Power_new_RPM${s}`] * Main[`WEP_power_mult`],
						atm.altitudeFromPressure(atm.pressure(Compressor[`Ceiling${s}`]) * pressureRatio),
						Compressor[`PowerAtCeiling${s}`] * Main[`WEP_power_mult`],
						lower_alt,
						curvature
					);
				} else {
					lower_alt = Main[`WEP_crit_altitude`];
					lower_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
				}
			} else {
				const bendsBelowCrit =
					!ignoreConstRPMOnWEP && ConstRPM_bends_below_critalt(Compressor, s);
				lower_alt = Main[`WEP_crit_altitude`];

				if (!bendsBelowCrit) {
					if (Compressor.ExactAltitudes) {
						lower_power = interpolatePowerOnAlt(
							Main[`Deck_Altitude${s}`],
							Main[`Power${s}`] * Main[`WEP_power_mult`],
							Compressor[`Altitude${s}`],
							Compressor[`Power${s}`] * Main[`WEP_power_mult`],
							Compressor[`Old_Altitude${s}`],
							curvature
						);
					} else {
						lower_power = Compressor[`Power${s}`] * Main[`WEP_power_mult`];
					}
				} else {
					lower_power = interpolatePowerOnAlt(
						Compressor[`AltitudeConstRPM${s}`],
						Compressor[`PowerConstRPM${s}`] * Main[`WEP_power_mult`],
						Compressor[`Altitude${s}`],
						Compressor[`Power${s}`] * Main[`WEP_power_mult`],
						lower_alt,
						curvature
					);
				}
			}

			const isCeilingUseful = Ceiling_is_useful(Compressor, s);
			if (!isCeilingUseful) {
				higher_alt = lower_alt + 1000;
				higher_power = lower_power * (atm.pressure(higher_alt) / atm.pressure(lower_alt));
			} else {
				const bendsAboveCrit =
					!ignoreConstRPMOnWEP && ConstRPM_bends_above_crit_alt(Compressor, s);
				if (bendsAboveCrit) {
					curvature = Compressor[`PowerConstRPMCurvature${s}`];
				}

				if (Compressor.ExactAltitudes) {
					higher_alt = atm.altitudeFromPressure(
						atm.pressure(Compressor[`Ceiling${s}`]) *
							(atm.pressure(Main[`WEP_crit_altitude`]) / atm.pressure(Compressor[`Altitude${s}`]))
					);
					higher_power = Compressor[`PowerAtCeiling${s}`] * Main[`WEP_power_mult`];
				} else {
					higher_alt = Compressor[`Ceiling${s}`];
					higher_power = Compressor[`PowerAtCeiling${s}`];
				}
			}

			// Swap if higher_alt altitude has more power than lower_alt altitude
			if (higher_alt < lower_alt && higher_power > lower_power) {
				[lower_alt, higher_alt] = [higher_alt, lower_alt];
				[lower_power, higher_power] = [higher_power, lower_power];
			}
		}

		return [lower_alt, lower_power, higher_alt, higher_power, curvature];
	}
	return [lower_alt, lower_power, higher_alt, higher_power, curvature];
}

// Helper function to collect intervals for a single engine
function collectIntervalSingleEngine(
	fm_dict: { [key: string]: any },
	engineKey: string,
	octane: boolean,
	power_modes: string[]
): { [key: string]: [number, number, number][] }[] {
	let [Engine, Compressor, Main, Modif, Afterburner, Propeller] = createFMshortcuts(
		fm_dict,
		engineKey
	);
	calculateBrrritishOctane(Modif, Main, octane);

	// Determine compressor stages count
	let compr_stages_count = 1;
	for (let compr_stage = 0; compr_stage < 6; compr_stage++) {
		if ('Power' + compr_stage.toString() in Compressor) {
			compr_stages_count = compr_stage + 1;
		}
	}

	let final_power_modes = ['military'];
	if (Afterburner) {
		final_power_modes = power_modes;
	}

	// Apply Soviet octane effects
	for (let s = 0; s < compr_stages_count; s++) {
		calculateSovietOctane(Compressor, Main, Modif, s);
	}

	// Initialize interval array for this engine
	let engineIntervals: { [key: string]: [number, number, number][] }[] = [];

	// Process each compressor stage
	for (let s = 0; s < compr_stages_count; s++) {
		engineIntervals[s] = {};

		final_power_modes.forEach((mode) => {
			// console.log('MODE', mode);
			engineIntervals[s][mode] = []; // Initialize mode array

			calculateWEPmult(Compressor, Main, s, octane, atm);
			let local_interval = calculateInterval(Compressor, Main, s, mode, -4000);

			


			for (let i = 0; i < 6; i++) {
				// Add next interval
				// console.log('LOCAL_INTERVAL_loop', s, '|', local_interval, local_interval[2] + 1);
				engineIntervals[s][mode].push([
					Math.round(atm.pressure(local_interval[0])),
					local_interval[1],
					local_interval[4]
				]);
				// console.log('LOCAL_INTERVAL', s, '|', local_interval);
				// Get next interval
				// console.log('higher_alt_pre', local_interval[2]);
				local_interval = calculateInterval(Compressor, Main, s, mode, local_interval[2] + 1);
				// console.log('higher_alt', local_interval[2]);
				// Break if we've reached the end
				if (Math.round(atm.pressure(local_interval[0])) === engineIntervals[s][mode][i][0]) {
					engineIntervals[s][mode].push([
						Math.round(atm.pressure(local_interval[2])),
						local_interval[3],
						0
					]);
					break;
				}
			}
		});
	}
	// console.log('ENGINE_INTERVALS', engineIntervals);
	return engineIntervals;
}

export function collectInterval(
	fm_dict: { [key: string]: any },
	octane: boolean,
	power_modes: string[],
	enginecount: number,
	engine_keys: string[]
): any[] {
	const fm_dict_copy = JSON.parse(JSON.stringify(fm_dict));

	// Handle engines based on whether they're the same or different
	if (fm_dict_copy.engines_are_same === true || enginecount <= 1) {
		// Most common case - all engines are identical
		// Only process the first engine and duplicate the result if needed
		const singleEngineInterval = collectIntervalSingleEngine(
			fm_dict_copy,
			engine_keys[0],
			octane,
			power_modes
		);

		// Return as an array with a single engine's data
		return [singleEngineInterval];
	} else {
		// Less common case - process each engine separately
		const allEngineIntervals = engine_keys.map((engineKey) =>
			collectIntervalSingleEngine(fm_dict_copy, engineKey, octane, power_modes)
		);

		// console.log('INTERVALS_MULTIPLE_ENGINES', allEngineIntervals);
		return allEngineIntervals;
	}
}

// If you need to calculate pressure for just one speed instead of the whole matrix:
export function calculatePressureForSingleSpeed(
	atm: Atmosphere,
	intake_efficiency: number,
	airspeed_kph: number,
	altitudeCount: number = 1001
): number[] {
	// Convert airspeed to m/s
	const airspeed_ms = airspeed_kph / 3.6;

	// Create array to hold pressure values
	const pressures: number[] = new Array(altitudeCount);

	// Precalculate the squared airspeed once
	const airspeedSquared = Math.pow(airspeed_ms, 2);

	// For each altitude
	for (let alt = 0; alt < altitudeCount; alt++) {
		const h = alt * 20; // 20m steps

		const density = atm.density(h);
		const static_pressure = atm.pressure(h);

		// Calculate dynamic pressure
		const dynamic_pressure = ((density * airspeedSquared) / 2) * intake_efficiency;

		// Store total pressure
		pressures[alt] = dynamic_pressure + static_pressure;
	}

	return pressures;
}
