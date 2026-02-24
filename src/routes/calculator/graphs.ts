import Plotly from 'plotly.js-dist';
import { rameffect_er } from '$lib/pressure_density_ram.js';
import { Atmosphere } from '$lib/atmosphere.js';
import { cacheFetch } from '$lib/cache';
import { DEFAULT_FUEL_PERCENT } from '$lib/calculator_defaults';
import { getFmJsonUrl } from '$lib/fm_data_url';
import planeversions from '$lib/oldest_same_fm_dict.json';
import {
	calculateEnginecount,
	collectInterval,
	createPowerMatrix
} from './engine_power';

let hoverstyle = 'x unified';
let sliderChangeListener: ((event: any) => void) | null = null;
const USE_CALCULATED_GRAPH_MIN = false;

interface SliderPowerMatrix {
	engine: number;
	mode: string;
	matrix: number[][];
	temperature?: number;
	planeName?: string;
	selectionIndex?: number;
}

function isRocketBoosterEngine(engineObj: { [key: string]: any } | undefined): boolean {
	if (!engineObj || typeof engineObj !== 'object') {
		return false;
	}

	return engineObj.Booster === true && engineObj?.Main?.Type === 'Rocket';
}

function isTakeoffBoosterEngine(engineObj: { [key: string]: any } | undefined): boolean {
	return isRocketBoosterEngine(engineObj) && engineObj?.External === true;
}

function shouldIncludeBoosterByDefault(fm_dict: { [key: string]: any }): boolean {
	const hasEngineTypeSchema = Object.keys(fm_dict).some((key) => /^EngineType\d+$/.test(key));
	const engineKeys = Object.keys(fm_dict).filter((key) =>
		hasEngineTypeSchema ? /^EngineType\d+$/.test(key) : /^Engine\d+$/.test(key)
	);
	const hasIntegratedBooster = engineKeys.some((key) => {
		const engineObj = fm_dict[key];
		return isRocketBoosterEngine(engineObj) && !isTakeoffBoosterEngine(engineObj);
	});

	return hasIntegratedBooster;
}

function isThrustEngineType(mainType: unknown): boolean {
	if (typeof mainType !== 'string') {
		return false;
	}

	return mainType.includes('Jet') || mainType.includes('Rocket');
}

function getThrustEngineKeys(fm_dict: { [key: string]: any }, engineKeys: string[]): string[] {
	return engineKeys.filter((engineKey) => isThrustEngineType(fm_dict?.[engineKey]?.Main?.Type));
}

function createPressureMatrixForSpeedType(
	atm: Atmosphere,
	intake_efficiency: number,
	rows: number,
	cols: number,
	speed_type: string
): number[][] {
	const matrix: number[][] = Array(cols)
		.fill(0)
		.map(() => Array(rows).fill(0));

	for (let row = 0; row < rows; row++) {
		const h = row * 20;
		const density = atm.density(h);
		const staticPressure = atm.pressure(h);

		for (let col = 0; col < cols; col++) {
			const selectedSpeedKph = col * 10;
			const tasKph = speed_type === 'IAS' ? atm.tas_from_ias(selectedSpeedKph, h) : selectedSpeedKph;
			const tasMs = tasKph / 3.6;
			const dynamicPressure = ((density * tasMs * tasMs) / 2) * intake_efficiency;
			matrix[col][row] = dynamicPressure + staticPressure;
		}
	}

	return matrix;
}

function getPistonEngineKeys(fm_dict: { [key: string]: any }, engineKeys: string[]): string[] {
	return engineKeys.filter((engineKey) => {
		const mainType = fm_dict?.[engineKey]?.Main?.Type;
		return mainType === 'Inline' || mainType === 'Radial';
	});
}

function getTurboPropEngineKeys(fm_dict: { [key: string]: any }, engineKeys: string[]): string[] {
	return engineKeys.filter((engineKey) => {
		const mainType = fm_dict?.[engineKey]?.Main?.Type;
		return mainType === 'TurboProp';
	});
}

function getPistonEngineInstanceCounts(
	fm_dict: { [key: string]: any },
	pistonEngineKeys: string[]
): { perKey: number[]; total: number } {
	const hasEngineTypeSchema = 'EngineType0' in fm_dict;

	if (!hasEngineTypeSchema) {
		const count = pistonEngineKeys.length;
		return {
			perKey: pistonEngineKeys.map(() => 1),
			total: count
		};
	}

	const typeCountByKey = new Map<string, number>();
	pistonEngineKeys.forEach((key) => typeCountByKey.set(key, 0));

	for (const [key, value] of Object.entries(fm_dict)) {
		if (!/^Engine\d+$/.test(key) || typeof value !== 'object' || value == null) {
			continue;
		}
		const typeIndex = value.Type;
		if (typeof typeIndex !== 'number') {
			continue;
		}
		const typeKey = `EngineType${typeIndex}`;
		if (typeCountByKey.has(typeKey)) {
			typeCountByKey.set(typeKey, (typeCountByKey.get(typeKey) || 0) + 1);
		}
	}

	const perKey = pistonEngineKeys.map((key) => {
		const counted = typeCountByKey.get(key) || 0;
		return counted > 0 ? counted : 1;
	});
	const total = perKey.reduce((sum, n) => sum + n, 0);

	return { perKey, total };
}

function getTotalMassFromFm(fm_dict: { [key: string]: any }, fuelPercent: number): number | null {
	const mass = fm_dict?.Mass;
	if (!mass) {
		return null;
	}

	const emptyMass = Number(mass.EmptyMass);
	const maxFuelMass = Number(mass.MaxFuelMass ?? 0);
	const maxNitro = Number(mass.MaxNitro ?? 0);
	const oilMass = Number(mass.OilMass ?? 0);
	const pilotMass = Number(mass.pilots_mass ?? 0);
	const ammoMass = Number(fm_dict?.Guns?.all_ammo_mass ?? 0);

	if (!Number.isFinite(emptyMass) || !Number.isFinite(maxFuelMass)) {
		return null;
	}

	return (
		emptyMass +
		maxFuelMass * (fuelPercent / 100) +
		maxNitro +
		oilMass +
		pilotMass +
		ammoMass
	);
}

function getThrustModeMultipliers(main: { [key: string]: any }): { military: number; WEP?: number } {
	let militaryThrottle = -Infinity;
	let militaryMultiplier = 1;
	let wepMultiplier: number | undefined;

	for (const [key, value] of Object.entries(main)) {
		if (!/^Mode\d+$/.test(key) || typeof value !== 'object' || value == null) {
			continue;
		}

		const throttle = Number((value as any).Throttle);
		const thrustMult = Number((value as any).ThrustMult);

		if (!Number.isFinite(throttle) || !Number.isFinite(thrustMult)) {
			continue;
		}

		if (throttle <= 1 && throttle > militaryThrottle) {
			militaryThrottle = throttle;
			militaryMultiplier = thrustMult;
		}

		if (throttle > 1) {
			if (wepMultiplier == null || thrustMult > wepMultiplier) {
				wepMultiplier = thrustMult;
			}
		}
	}

	if (!Number.isFinite(militaryMultiplier) || militaryMultiplier <= 0) {
		militaryMultiplier = 1;
	}

	return {
		military: militaryMultiplier,
		WEP: wepMultiplier
	};
}

function getSortedIndicesByPrefix(obj: { [key: string]: any }, prefix: string): number[] {
	return Object.keys(obj)
		.map((key) => {
			const match = key.match(new RegExp(`^${prefix}(\\d+)$`));
			return match ? Number(match[1]) : null;
		})
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
		.sort((a, b) => a - b);
}

interface ThrustMaxTable {
	altitudeIndices: number[];
	altitudeValues: number[];
	velocityIndices: number[];
	velocityValues: number[];
	coeffGrid: number[][];
	torqueCoeffGrid: number[][];
	thrAftCoeffGrid?: number[][];
}

function linearInterpolate(x0: number, y0: number, x1: number, y1: number, x: number): number {
	if (x1 === x0) {
		return y0;
	}

	return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function getLowerBracketIndex(sortedValues: number[], value: number): number {
	const lastIndex = sortedValues.length - 1;
	if (lastIndex <= 0) {
		return 0;
	}

	if (value <= sortedValues[0]) {
		return 0;
	}

	if (value >= sortedValues[lastIndex]) {
		return lastIndex - 1;
	}

	let left = 0;
	let right = lastIndex - 1;

	while (left <= right) {
		const mid = (left + right) >> 1;
		const low = sortedValues[mid];
		const high = sortedValues[mid + 1];

		if (value >= low && value <= high) {
			return mid;
		}

		if (value < low) {
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}

	return Math.max(0, Math.min(lastIndex - 1, left));
}

function buildThrustMaxTable(thrustMax: { [key: string]: any }): ThrustMaxTable | null {
	const altitudeIndices = getSortedIndicesByPrefix(thrustMax, 'Altitude_');
	const velocityIndices = getSortedIndicesByPrefix(thrustMax, 'Velocity_');

	if (altitudeIndices.length < 2 || velocityIndices.length < 2) {
		return null;
	}

	const altitudeValues = altitudeIndices.map((idx) => Number(thrustMax[`Altitude_${idx}`]));
	const velocityValues = velocityIndices.map((idx) => Number(thrustMax[`Velocity_${idx}`]));

	if (
		altitudeValues.some((value) => !Number.isFinite(value)) ||
		velocityValues.some((value) => !Number.isFinite(value))
	) {
		return null;
	}

	const coeffGrid: number[][] = Array(altitudeIndices.length)
		.fill(0)
		.map(() => Array(velocityIndices.length).fill(0));
	const torqueCoeffGrid: number[][] = Array(altitudeIndices.length)
		.fill(0)
		.map(() => Array(velocityIndices.length).fill(0));
	const thrAftCoeffGrid: number[][] = Array(altitudeIndices.length)
		.fill(0)
		.map(() => Array(velocityIndices.length).fill(1));

	for (let altPos = 0; altPos < altitudeIndices.length; altPos++) {
		const altIdx = altitudeIndices[altPos];
		for (let velPos = 0; velPos < velocityIndices.length; velPos++) {
			const velIdx = velocityIndices[velPos];
			const coeffRaw = Number(thrustMax[`ThrustMaxCoeff_${altIdx}_${velIdx}`]);
			const torqueCoeffRaw = Number(thrustMax[`TorqueMaxCoeff_${altIdx}_${velIdx}`]);
			const thrAftCoeffRaw = Number(thrustMax[`ThrAftMaxCoeff_${altIdx}_${velIdx}`]);
			coeffGrid[altPos][velPos] = Number.isFinite(coeffRaw) ? coeffRaw : 0;
			torqueCoeffGrid[altPos][velPos] = Number.isFinite(torqueCoeffRaw)
				? torqueCoeffRaw
				: coeffGrid[altPos][velPos];
			thrAftCoeffGrid[altPos][velPos] = Number.isFinite(thrAftCoeffRaw) ? thrAftCoeffRaw : 1;
		}
	}

	return {
		altitudeIndices,
		altitudeValues,
		velocityIndices,
		velocityValues,
		coeffGrid,
		torqueCoeffGrid,
		thrAftCoeffGrid
	};
}

function getInterpolatedCoeffFromGrid(
	table: ThrustMaxTable,
	coeffGrid: number[][],
	altitude: number,
	velocity: number
): number {
	const altLowPos = getLowerBracketIndex(table.altitudeValues, altitude);
	const velLowPos = getLowerBracketIndex(table.velocityValues, velocity);
	const altHighPos = altLowPos + 1;
	const velHighPos = velLowPos + 1;

	const c00 = coeffGrid[altLowPos][velLowPos];
	const c01 = coeffGrid[altLowPos][velHighPos];
	const c10 = coeffGrid[altHighPos][velLowPos];
	const c11 = coeffGrid[altHighPos][velHighPos];

	const coeffAtAltLow = linearInterpolate(
		table.velocityValues[velLowPos],
		c00,
		table.velocityValues[velHighPos],
		c01,
		velocity
	);
	const coeffAtAltHigh = linearInterpolate(
		table.velocityValues[velLowPos],
		c10,
		table.velocityValues[velHighPos],
		c11,
		velocity
	);

	return linearInterpolate(
		table.altitudeValues[altLowPos],
		coeffAtAltLow,
		table.altitudeValues[altHighPos],
		coeffAtAltHigh,
		altitude
	);
}

function getInterpolatedThrustCoeffFromTable(
	table: ThrustMaxTable,
	altitude: number,
	velocity: number
): number {
	return getInterpolatedCoeffFromGrid(table, table.coeffGrid, altitude, velocity);
}

function getInterpolatedThrAftCoeffFromTable(
	table: ThrustMaxTable,
	altitude: number,
	velocity: number
): number {
	if (!table.thrAftCoeffGrid) {
		return 1;
	}

	return getInterpolatedCoeffFromGrid(table, table.thrAftCoeffGrid, altitude, velocity);
}

function getInterpolatedTorqueCoeffFromTable(
	table: ThrustMaxTable,
	altitude: number,
	velocity: number
): number {
	return getInterpolatedCoeffFromGrid(table, table.torqueCoeffGrid, altitude, velocity);
}

function createTurboPropPowerMatrices(
	fm_dict: { [key: string]: any },
	turboPropEngineKeys: string[],
	atm: Atmosphere,
	rows: number,
	cols: number,
	speed_type: string,
	power_modes: string[]
): SliderPowerMatrix[] {
	const matrices: SliderPowerMatrix[] = [];
	const altitudeByRow = Array.from({ length: rows }, (_, row) => row * 20);
	const tasBySpeedAltitude: number[][] = Array(cols)
		.fill(0)
		.map(() => Array(rows).fill(0));

	for (let row = 0; row < rows; row++) {
		const altitude = altitudeByRow[row];
		for (let col = 0; col < cols; col++) {
			const selectedSpeedKph = col * 10;
			tasBySpeedAltitude[col][row] =
				speed_type === 'IAS' ? atm.tas_from_ias(selectedSpeedKph, altitude) : selectedSpeedKph;
		}
	}

	const wantsMilitary = power_modes.includes('military');
	const wantsWEP = power_modes.includes('WEP');
	const modesToEmit = [
		...(wantsMilitary ? ['military'] : []),
		...(wantsWEP ? ['WEP'] : [])
	];
	if (modesToEmit.length === 0) {
		modesToEmit.push('military');
	}

	for (let engineIndex = 0; engineIndex < turboPropEngineKeys.length; engineIndex++) {
		const engineKey = turboPropEngineKeys[engineIndex];
		const engineMain = fm_dict?.[engineKey]?.Main;
		const thrustMax = engineMain?.ThrustMax;

		if (typeof thrustMax !== 'object' || thrustMax == null) {
			continue;
		}

		const powerBase = Number(engineMain?.Power ?? engineMain?.Power0);
		if (!Number.isFinite(powerBase) || powerBase <= 0) {
			continue;
		}

		const thrustTable = buildThrustMaxTable(thrustMax);
		if (thrustTable == null) {
			continue;
		}

		const matrix: number[][] = Array(cols)
			.fill(0)
			.map(() => Array(rows).fill(0));

		for (let row = 0; row < rows; row++) {
			const altitude = altitudeByRow[row];
			for (let col = 0; col < cols; col++) {
				const tasKph = tasBySpeedAltitude[col][row];
				const torqueCoeff = getInterpolatedTorqueCoeffFromTable(thrustTable, altitude, tasKph);
				matrix[col][row] = Math.max(0, powerBase * torqueCoeff);
			}
		}

		for (const mode of modesToEmit) {
			matrices.push({
				engine: engineIndex,
				mode,
				matrix
			});
		}
	}

	return matrices;
}

function createThrustMatrices(
	fm_dict: { [key: string]: any },
	thrustEngineKeys: string[],
	atm: Atmosphere,
	rows: number,
	cols: number,
	speed_type: string,
	power_modes: string[],
	includeBoosterThrust: boolean
): SliderPowerMatrix[] {
	const matrices: SliderPowerMatrix[] = [];
	const altitudeByRow = Array.from({ length: rows }, (_, row) => row * 20);
	const tasBySpeedAltitude: number[][] = Array(cols)
		.fill(0)
		.map(() => Array(rows).fill(0));
	const modeMultipliersByEngine = new Map<string, { military: number; WEP?: number }>();

	for (const engineKey of thrustEngineKeys) {
		const engineMain = fm_dict?.[engineKey]?.Main;
		modeMultipliersByEngine.set(engineKey, getThrustModeMultipliers(engineMain));
	}

	const hasAnyNonBoosterWep = thrustEngineKeys.some((engineKey) => {
		const engineObj = fm_dict?.[engineKey];
		if (isRocketBoosterEngine(engineObj)) {
			return false;
		}

		return modeMultipliersByEngine.get(engineKey)?.WEP != null;
	});

	for (let row = 0; row < rows; row++) {
		const altitude = altitudeByRow[row];
		for (let col = 0; col < cols; col++) {
			const selectedSpeedKph = col * 10;
			tasBySpeedAltitude[col][row] =
				speed_type === 'IAS' ? atm.tas_from_ias(selectedSpeedKph, altitude) : selectedSpeedKph;
		}
	}

	for (let engineIndex = 0; engineIndex < thrustEngineKeys.length; engineIndex++) {
		const engineKey = thrustEngineKeys[engineIndex];
		const engineObj = fm_dict?.[engineKey];
		const isBoosterEngine = isRocketBoosterEngine(engineObj);

		if (!includeBoosterThrust && isRocketBoosterEngine(engineObj)) {
			continue;
		}

		const engineMain = fm_dict?.[engineKey]?.Main;
		const multipliers = modeMultipliersByEngine.get(engineKey) ?? getThrustModeMultipliers(engineMain);
		const afterburnerBoostRaw = Number(engineMain?.AfterburnerBoost);
		const afterburnerBoost =
			Number.isFinite(afterburnerBoostRaw) && afterburnerBoostRaw > 0 ? afterburnerBoostRaw : 1;
		const modeMap: Array<{ mode: string; multiplier: number }> = [];
		const wantsMilitary = power_modes.includes('military');
		const wantsWEP = power_modes.includes('WEP');
		const pushMode = (mode: string, multiplier: number) => {
			if (modeMap.some((item) => item.mode === mode)) {
				return;
			}
			modeMap.push({ mode, multiplier });
		};

		if (wantsMilitary || (wantsWEP && multipliers.WEP == null && !isBoosterEngine)) {
			pushMode('military', multipliers.military);
		}

		if (wantsWEP && multipliers.WEP != null) {
			pushMode('WEP', multipliers.WEP);
		} else if (wantsWEP && isBoosterEngine) {
			const boosterModeName = hasAnyNonBoosterWep ? 'WEP' : 'military';
			pushMode(boosterModeName, multipliers.military);
		}

		const engineType = engineMain?.Type;
		if (engineType === 'Rocket') {
			const thrustBaseNewton = Number(engineMain?.Thrust);
			const thrustBase = thrustBaseNewton * 0.1019716213;

			if (!Number.isFinite(thrustBase) || thrustBase <= 0) {
				continue;
			}

			for (const modeEntry of modeMap) {
				const matrix: number[][] = Array(cols)
					.fill(0)
					.map(() => Array(rows).fill(0));
				const afterburnerModeBoost = modeEntry.mode === 'WEP' ? afterburnerBoost : 1;
				const thrustValue = Math.max(0, thrustBase * modeEntry.multiplier * afterburnerModeBoost);

				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						matrix[col][row] = thrustValue;
					}
				}

				matrices.push({
					engine: engineIndex,
					mode: modeEntry.mode,
					matrix
				});
			}

			continue;
		}

		const thrustMax = engineMain?.ThrustMax;

		if (typeof thrustMax !== 'object' || thrustMax == null) {
			continue;
		}

		const thrustBase = Number(thrustMax.ThrustMax0);
		if (!Number.isFinite(thrustBase) || thrustBase <= 0) {
			continue;
		}

		const thrustTable = buildThrustMaxTable(thrustMax);
		if (thrustTable == null) {
			continue;
		}

		for (const modeEntry of modeMap) {
			const matrix: number[][] = Array(cols)
				.fill(0)
				.map(() => Array(rows).fill(0));

			for (let row = 0; row < rows; row++) {
				const altitude = altitudeByRow[row];

				for (let col = 0; col < cols; col++) {
					const tasKph = tasBySpeedAltitude[col][row];
					const coeff = getInterpolatedThrustCoeffFromTable(thrustTable, altitude, tasKph);
					const thrAftCoeff =
						modeEntry.mode === 'WEP'
							? getInterpolatedThrAftCoeffFromTable(thrustTable, altitude, tasKph)
							: 1;
					const afterburnerModeBoost = modeEntry.mode === 'WEP' ? afterburnerBoost : 1;
					matrix[col][row] = Math.max(
						0,
						thrustBase * coeff * modeEntry.multiplier * thrAftCoeff * afterburnerModeBoost
					);
				}
			}

			matrices.push({
				engine: engineIndex,
				mode: modeEntry.mode,
				matrix
			});
		}
	}

	return matrices;
}

function getVersionTag(basePlaneId: string, selectedVersion: string): string {
	const versionsByPlane = planeversions as Record<string, string[]>;
	const planeVersions = versionsByPlane?.[basePlaneId];
	if (!Array.isArray(planeVersions) || planeVersions.length === 0) {
		return '';
	}

	const sortedPlaneVersions = [...planeVersions].sort((a, b) =>
		b.localeCompare(a, undefined, { numeric: true })
	);
	const selectedIndex = sortedPlaneVersions.indexOf(selectedVersion);
	if (selectedIndex < 0) {
		return '';
	}

	const versionNumber = sortedPlaneVersions.length - selectedIndex;
	return `v${versionNumber}`;
}

// function rename_duplicates(chosenplanes_ingame) {
// 	const counts = {};
// 	return chosenplanes_ingame.map((str) => {
// 		const count = counts[str] || 2;
// 		counts[str] = count + 1;
// 		return count > 2 ? `${str}_${count - 1}?` : str;
// 	});
// }
export async function makeGraphFromForm(
	performance_type,
	graph_d,
	power_unit,
	thrust_unit,
	weight_unit,
	power_modes,
	speed_type,
	speed,
	speed_unit,
	max_alt,
	alt_unit,
	air_temp,
	air_temp_unit,
	autoscale,
	lowest_resp_var,
	highest_resp_var,
	axis_layout,
	chosenplanes,
	chosenplanes_ingame,
	fuel_percents,
	include_boosters,
	plane_versions,
	vs_mode,
	colour_set,
	bg_col
) {
	if (chosenplanes.length === 0) {
		Plotly.purge('graphid');
		return;
	}

	if (
		power_modes.length === 0 ||
		speed_type == null ||
		fuel_percents.some(
			(element) => element > 100 || fuel_percents.some((element) => element < 0)
		) ||
		plane_versions.length === 0 ||
		performance_type == null ||
		graph_d == null
	) {
		return;
	}

	if (vs_mode && chosenplanes.length !== 2) {
		Plotly.purge('graphid');
		return;
	}

	const isPowerMetric = performance_type === 'power' || performance_type === 'power/weight';
	const isThrustMetric = performance_type === 'thrust' || performance_type === 'thrust/weight';

	let power_factor = 1;
	if (isPowerMetric) {
		if (power_unit === 'kW') {
			power_factor = 1.341021859;
		} else if (power_unit === 'kcal/s') {
			power_factor = 5.610835376;
		}
	}

	let weight_factor = 1;
	if (weight_unit === 'lb') {
		weight_factor = 0.453592;
	} else if (weight_unit === 'oz') {
		weight_factor = 0.0283495;
	} else if (weight_unit === '🐎⚖️') {
		weight_factor = 800;
	}

	let thrust_factor = 1;
	if (isThrustMetric) {
		if (thrust_unit === 'N') {
			thrust_factor = 0.1019716213;
		} else if (thrust_unit === 'lbf') {
			thrust_factor = 0.45359237;
		} else if (thrust_unit === '🐎⬅️') {
			thrust_factor = 76.04022491;
		}
	}

	let speed_factor = 1;
	if (speed_unit === 'mph') {
		speed_factor = 1.609344;
	} else if (speed_unit === 'kt') {
		speed_factor = 1.852;
	} else if (speed_unit === 'm/s') {
		speed_factor = 3.6;
	} else if (speed_unit === '🐎💨') {
		speed_factor = 40;
	}

	let alt_factor = 1;
	if (alt_unit === 'ft') {
		alt_factor = 0.3048;
	} else if (alt_unit === 'mile') {
		alt_factor = 1609.34;
	} else if (alt_unit === '🐎⬆️') {
		alt_factor = 1.8;
	} else if (alt_unit === 'yard') {
		alt_factor = 0.9144;
	}

	let air_tempK = air_temp;
	if (air_temp_unit === '°C') {
		air_tempK = air_temp + 273.15;
	} else if (air_temp_unit === '°F') {
		air_tempK = (air_temp - 32) / 1.8;
	} else if (air_temp_unit === '🐎🌡️') {
		air_tempK = air_temp * 38 + 273.15;
	}
	const atm = new Atmosphere();
	atm.set(101300.0, air_tempK);

	let max_altm = Math.round(max_alt * alt_factor);

	// Fetch all plane data in parallel for maximum performance.
	// Duplicates like "plane:2" reuse the base plane FM file, but keep per-selection identity.
	let selectedPlaneData: Array<{
		selectionId: string;
		basePlaneId: string;
		index: number;
		data: any;
	}> = [];
	const results = await Promise.all(
		chosenplanes.map(async (plane, index) => {
			const basePlaneId = plane.split(':')[0];
			const selectedVersion = plane_versions[index];

			if (!selectedVersion) {
				console.warn(`Skipping ${plane}: no selected game version.`);
				return null;
			}

			const cacheKey = `${selectedVersion}_${basePlaneId}`;
			try {
				const data = await cacheFetch<any>(cacheKey, () =>
					fetch(getFmJsonUrl(selectedVersion, basePlaneId))
				);
				return { selectionId: plane, basePlaneId, index, data };
			} catch (error) {
				console.error(
					`Skipping ${plane} (version ${selectedVersion}) due to FM fetch/parse error:`,
					error
				);
				return null;
			}
		})
	);

	selectedPlaneData = results.filter(
		(item): item is { selectionId: string; basePlaneId: string; index: number; data: any } =>
			item !== null
	);

	if (selectedPlaneData.length === 0) {
		Plotly.purge('graphid');
		return;
	}

	console.log('Fetched plane data:', selectedPlaneData);

	// Define dimensions for matrices
	const maxGraphSpeedKph = isThrustMetric ? 2000 : 1000;
	const speeds = Math.floor(maxGraphSpeedKph / 10) + 1;
	const altitudes = Math.round(max_altm / 20);
	// Generate speed values for the graph
	const speed_values = Array.from({ length: speeds }, (_, col) => col * 10);
	let allPowerMatrices: SliderPowerMatrix[] = [];

	// Process each selected plane in input order to keep legend/trace mapping stable.
	for (const { selectionId, basePlaneId, index, data: fm_dict } of selectedPlaneData) {
		const ingameName = chosenplanes_ingame[index] || selectionId;
		const fuelPercent = fuel_percents[index] ?? DEFAULT_FUEL_PERCENT;
		const includeBoosterThrust = include_boosters[index] ?? shouldIncludeBoosterByDefault(fm_dict);
		const selectedVersion = plane_versions[index];
		const versionTag = getVersionTag(basePlaneId, selectedVersion);
		const displayNameWithVersion = versionTag ? `${ingameName} ${versionTag}` : ingameName;
		const displayPlaneName =
			performance_type === 'power/weight' || performance_type === 'thrust/weight'
				? `${displayNameWithVersion} [${fuelPercent}%]`
				: displayNameWithVersion;

		// Determine engine count and keys
		let [, engineKeys] = calculateEnginecount(fm_dict);
		let curveEngineKeys: string[] = [];
		let baseMatrices: SliderPowerMatrix[] = [];

		if (isPowerMetric) {
			const turboPropEngineKeys = getTurboPropEngineKeys(fm_dict, engineKeys);
			const pistonEngineKeys = getPistonEngineKeys(fm_dict, engineKeys);

			if (turboPropEngineKeys.length > 0 && pistonEngineKeys.length === 0) {
				curveEngineKeys = turboPropEngineKeys;
				baseMatrices = createTurboPropPowerMatrices(
					fm_dict,
					turboPropEngineKeys,
					atm,
					altitudes,
					speeds,
					speed_type,
					power_modes
				);
			} else {
				curveEngineKeys = pistonEngineKeys;

				if (pistonEngineKeys.length === 0) {
					console.warn(`Skipping ${selectionId}: no power-capable prop engines found.`);
					continue;
				}

				const engineKey = pistonEngineKeys[0];
				const intake_efficiency = fm_dict[engineKey]?.Compressor?.SpeedManifoldMultiplier;
				if (!Number.isFinite(intake_efficiency)) {
					console.warn(`Skipping ${selectionId}: invalid intake efficiency.`);
					continue;
				}

				const intervals = collectInterval(
					fm_dict,
					true,
					power_modes,
					pistonEngineKeys.length,
					pistonEngineKeys
				);

				const pressureMatrix = createPressureMatrixForSpeedType(
					atm,
					intake_efficiency,
					altitudes,
					speeds,
					speed_type
				);

				baseMatrices = createPowerMatrix(intervals, pressureMatrix, altitudes, speeds);
			}
		} else if (isThrustMetric) {
			const thrustEngineKeys = getThrustEngineKeys(fm_dict, engineKeys);
			curveEngineKeys = thrustEngineKeys;

			if (thrustEngineKeys.length === 0) {
				console.warn(`Skipping ${selectionId}: no jet/rocket engines found.`);
				continue;
			}

			baseMatrices = createThrustMatrices(
				fm_dict,
				thrustEngineKeys,
				atm,
				altitudes,
				speeds,
				speed_type,
				power_modes,
				includeBoosterThrust
			);
		}

		if (baseMatrices.length === 0) {
			console.warn(`Skipping ${selectionId}: no graphable matrices for selected mode(s).`);
			continue;
		}

		const curveEngineCount = curveEngineKeys.length;
		const curveInstanceCountInfo = getPistonEngineInstanceCounts(fm_dict, curveEngineKeys);
		const engineInstancesPerCurve = curveInstanceCountInfo.perKey;
		const totalEngineCount = curveInstanceCountInfo.total;

		const isWeightMetric = performance_type === 'power/weight' || performance_type === 'thrust/weight';
		let totalMass: number | null = null;

		if (isWeightMetric) {
			totalMass = getTotalMassFromFm(fm_dict, fuelPercent);
		}

		if (isWeightMetric && totalMass == null) {
			console.warn(`Skipping ${selectionId}: mass data not found.`);
			continue;
		}

		if (isWeightMetric && totalMass != null) {
			if (fm_dict.engines_are_same === true || curveEngineCount <= 1) {
				baseMatrices.forEach((matrixObj) => {
					const perCurveMultiplier =
						fm_dict.engines_are_same === true
							? totalEngineCount || 1
							: engineInstancesPerCurve[matrixObj.engine] || 1;
					const transformedMatrix = matrixObj.matrix.map((speedRow) =>
						speedRow.map((value) => {
							if (isPowerMetric) {
								return ((value * perCurveMultiplier) / (totalMass * weight_factor)) / power_factor;
							}

							return ((value * perCurveMultiplier) / (totalMass * weight_factor)) / thrust_factor;
						})
					);

					allPowerMatrices.push({
						...matrixObj,
						matrix: transformedMatrix,
						planeName: displayPlaneName,
						selectionIndex: index
					});
				});
			} else {
				const modeOrder: string[] = [];
				const scaledByEngineMode = new Map<number, Map<string, number[][]>>();

				baseMatrices.forEach((matrixObj) => {
					if (!modeOrder.includes(matrixObj.mode)) {
						modeOrder.push(matrixObj.mode);
					}

					const perCurveMultiplier = engineInstancesPerCurve[matrixObj.engine] || 1;
					const scaledMatrix = matrixObj.matrix.map((speedRow) =>
						speedRow.map((value) => value * perCurveMultiplier)
					);

					if (!scaledByEngineMode.has(matrixObj.engine)) {
						scaledByEngineMode.set(matrixObj.engine, new Map<string, number[][]>());
					}

					scaledByEngineMode.get(matrixObj.engine)!.set(matrixObj.mode, scaledMatrix);
				});

				const summedByMode = new Map<string, { mode: string; matrix: number[][] }>();
				for (const mode of modeOrder) {
					const summedMatrix = baseMatrices[0].matrix.map((speedRow) => speedRow.map(() => 0));

					for (const engineModes of scaledByEngineMode.values()) {
						let sourceMode = mode;
						if (
							isThrustMetric &&
							mode === 'WEP' &&
							!engineModes.has('WEP') &&
							engineModes.has('military')
						) {
							sourceMode = 'military';
						}

						const sourceMatrix = engineModes.get(sourceMode);
						if (!sourceMatrix) {
							continue;
						}

						for (let speedIdx = 0; speedIdx < sourceMatrix.length; speedIdx++) {
							for (let altIdx = 0; altIdx < sourceMatrix[speedIdx].length; altIdx++) {
								summedMatrix[speedIdx][altIdx] += sourceMatrix[speedIdx][altIdx];
							}
						}
					}

					summedByMode.set(mode, {
						mode,
						matrix: summedMatrix
					});
				}

				let aggregatedEngineIndex = 0;
				summedByMode.forEach((summed) => {
					const transformedMatrix = summed.matrix.map((speedRow) =>
						speedRow.map((value) => {
							if (isPowerMetric) {
								return (value / (totalMass * weight_factor)) / power_factor;
							}

							return (value / (totalMass * weight_factor)) / thrust_factor;
						})
					);

					allPowerMatrices.push({
						engine: aggregatedEngineIndex++,
						mode: summed.mode,
						matrix: transformedMatrix,
						planeName: displayPlaneName,
						selectionIndex: index
					});
				});
			}
		} else {
			const transformedMatrices = baseMatrices.map((matrixObj) => ({
				...matrixObj,
				matrix: matrixObj.matrix.map((speedRow) =>
					speedRow.map((value) => {
						if (isPowerMetric) {
							return value / power_factor;
						}

						if (isThrustMetric) {
							return value / thrust_factor;
						}

						return value;
					})
				)
			}));

			if (fm_dict.engines_are_same === true || curveEngineCount <= 1) {
				transformedMatrices.forEach((matrix) => {
					allPowerMatrices.push({
						...matrix,
						planeName: displayPlaneName,
						selectionIndex: index
					});
				});
			} else {
				transformedMatrices.forEach((matrix) => {
					allPowerMatrices.push({
						...matrix,
						planeName: `${displayPlaneName} (Engine ${matrix.engine})`,
						selectionIndex: index
					});
				});
			}
		}
	}

	if (allPowerMatrices.length === 0) {
		Plotly.purge('graphid');
		return;
	}

	let matricesForPlot = allPowerMatrices;
	let vsLabel: string | null = null;

	if (vs_mode) {
		const vsResult = buildVsPowerMatrices(
			allPowerMatrices,
			chosenplanes,
			chosenplanes_ingame,
			plane_versions,
			power_modes
		);

		if (!vsResult) {
			Plotly.purge('graphid');
			return;
		}

		matricesForPlot = vsResult.matrices;
		vsLabel = vsResult.label;
	}

	if (graph_d === '3D') {
		plotly_generator_3d(
			matricesForPlot,
			chosenplanes_ingame,
			power_unit,
			thrust_unit,
			weight_unit,
			alt_unit,
			alt_factor,
			speed_factor,
			speed_type,
			speed_unit,
			air_temp,
			air_temp_unit,
			autoscale,
			lowest_resp_var,
			highest_resp_var,
			axis_layout,
			performance_type,
			colour_set,
			bg_col,
			vs_mode,
			vsLabel
		);
		return;
	}

	plotly_2D_generator(
		matricesForPlot,
		speed_values,
		chosenplanes_ingame,
		power_unit,
		thrust_unit,
		weight_unit,
		max_alt,
		alt_unit,
		alt_factor,
		speed_factor,
		speed_type,
		speed_unit,
		speed,
		air_temp,
		air_temp_unit,
		autoscale,
		lowest_resp_var,
		highest_resp_var,
		axis_layout,
		performance_type,
		colour_set,
		hoverstyle,
		bg_col,
		vs_mode,
		vsLabel,
		true
	);
}

function buildVsPowerMatrices(
	power_matrices: SliderPowerMatrix[],
	chosenplanes: string[],
	chosenplanes_ingame: string[],
	plane_versions: string[],
	targetModes: string[]
): { matrices: SliderPowerMatrix[]; label: string } | null {
	if (chosenplanes.length < 2) {
		return null;
	}

	const firstSelectionIndex = 0;
	const secondSelectionIndex = 1;
	const normalizedTargetModes = targetModes.filter((mode) => typeof mode === 'string' && mode.length > 0);

	const pickFirstEngineTrace = (
		selectionIndex: number,
		preferredModes: string[]
	): SliderPowerMatrix | null => {
		const samePlane = power_matrices
			.filter((matrixEntry) => matrixEntry.selectionIndex === selectionIndex)
			.sort((a, b) => a.engine - b.engine);

		if (samePlane.length === 0) {
			return null;
		}

		for (const mode of preferredModes) {
			const samePlaneAndMode = samePlane.filter((entry) => entry.mode === mode);
			if (samePlaneAndMode.length === 0) {
				continue;
			}

			const explicitEngineZero = samePlaneAndMode.find((entry) => entry.engine === 0);
			return explicitEngineZero ?? samePlaneAndMode[0];
		}

		const explicitEngineZero = samePlane.find((entry) => entry.engine === 0);
		return explicitEngineZero ?? samePlane[0];
	};

	const defaultModeOrder = ['WEP', 'military'];
	const firstPlanePreferredModes =
		normalizedTargetModes.length > 0 ? normalizedTargetModes : defaultModeOrder;
	const secondPlanePreferredModes =
		normalizedTargetModes.length > 1
			? [normalizedTargetModes[1], normalizedTargetModes[0]]
			: firstPlanePreferredModes;

	const firstPlaneTrace = pickFirstEngineTrace(firstSelectionIndex, firstPlanePreferredModes);
	const secondPlaneTrace = pickFirstEngineTrace(secondSelectionIndex, secondPlanePreferredModes);

	if (!firstPlaneTrace || !secondPlaneTrace) {
		return null;
	}

	const speedCount = Math.min(firstPlaneTrace.matrix.length, secondPlaneTrace.matrix.length);
	const diffMatrix: number[][] = Array.from({ length: speedCount }, (_, speedIdx) => {
		const firstSpeedRow = firstPlaneTrace.matrix[speedIdx];
		const secondSpeedRow = secondPlaneTrace.matrix[speedIdx];
		const altitudeCount = Math.min(firstSpeedRow.length, secondSpeedRow.length);

		return Array.from(
			{ length: altitudeCount },
			(_, altIdx) => firstSpeedRow[altIdx] - secondSpeedRow[altIdx]
		);
	});

	const firstBasePlaneId = chosenplanes[0]?.split(':')[0] ?? chosenplanes[0];
	const secondBasePlaneId = chosenplanes[1]?.split(':')[0] ?? chosenplanes[1];
	const firstVersionTag = getVersionTag(firstBasePlaneId, plane_versions[0]);
	const secondVersionTag = getVersionTag(secondBasePlaneId, plane_versions[1]);
	const firstPlaneBaseName = chosenplanes_ingame[0] || chosenplanes[0];
	const secondPlaneBaseName = chosenplanes_ingame[1] || chosenplanes[1];
	const firstPlaneName = firstVersionTag
		? `${firstPlaneBaseName} ${firstVersionTag}`
		: firstPlaneBaseName;
	const secondPlaneName = secondVersionTag
		? `${secondPlaneBaseName} ${secondVersionTag}`
		: secondPlaneBaseName;
	const label = `${firstPlaneName} - ${secondPlaneName}`;

	return {
		matrices: [
			{
				engine: 0,
				mode: '',
				matrix: diffMatrix,
				planeName: label,
				selectionIndex: 0
			}
		],
		label
	};
}


function calculateTickInterval(lowest: number, highest: number): number {
	// Get the range
	const range = highest - lowest;
	if (range <= 0 || !Number.isFinite(range)) {
		return 1;
	}

	// Get order of magnitude using log10
	const magnitude = Math.floor(Math.log10(range));

	// Base tick size is 10^magnitude
	let tickSize = Math.pow(10, magnitude);

	// Adjust tick size based on range within order of magnitude
	if (range / tickSize <= 1) {
		tickSize = tickSize / 10;
	} else if (range / tickSize < 2) {
		tickSize = tickSize / 5;
	} else if (range / tickSize < 5) {
		tickSize = tickSize / 2;
	}

	return tickSize;
}

function getMinMax(values: number[]): { min: number; max: number } {
	if (values.length === 0) {
		return { min: 0, max: 0 };
	}

	let minValue = values[0];
	let maxValue = values[0];

	for (let i = 1; i < values.length; i++) {
		const value = values[i];
		if (value < minValue) minValue = value;
		if (value > maxValue) maxValue = value;
	}

	return { min: minValue, max: maxValue };
}

function getGraphAutoMin(rawMinValue: number, rangePadding: number, vs_mode: boolean): number {
	const calculatedMin = vs_mode ? rawMinValue - rangePadding : Math.max(0, rawMinValue - rangePadding);
	if (rawMinValue < 0) {
		return rawMinValue - rangePadding;
	}

	if (!USE_CALCULATED_GRAPH_MIN) {
		return 0;
	}

	return calculatedMin;
}

function getMetricAxisLabel(
	performance_type: string,
	power_unit: string,
	thrust_unit: string,
	weight_unit: string
): string {
	if (performance_type === 'power') {
		return `Power [${power_unit}]`;
	}

	if (performance_type === 'power/weight') {
		return `Power / Weight [${power_unit}/${weight_unit}]`;
	}

	if (performance_type === 'thrust') {
		return `Thrust [${thrust_unit}]`;
	}

	return `Thrust / Weight [${thrust_unit}/${weight_unit}]`;
}

function getMetricTitle(performance_type: string): string {
	if (performance_type === 'power') {
		return 'Engine power';
	}

	if (performance_type === 'power/weight') {
		return 'Power / Weight';
	}

	if (performance_type === 'thrust') {
		return 'Engine thrust';
	}

	return 'Thrust / Weight';
}

function toRgba(colour: string, alpha: number): string {
	const match = colour.match(/rgba?\(([^)]+)\)/i);
	if (!match) {
		return colour;
	}

	const parts = match[1]
		.split(',')
		.slice(0, 3)
		.map((part) => Number(part.trim()));

	if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
		return colour;
	}

	return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function getEffectiveHoverMode(hovermode: string, axis_layout: boolean): string | false {
	if (!axis_layout) {
		return hovermode;
	}

	if (hovermode === 'x') {
		return 'y';
	}

	if (hovermode === 'x unified') {
		return 'y unified';
	}

	return hovermode;
}

function isNonUnifiedHoverMode(hovermode: string | false): boolean {
	return hovermode === 'x' || hovermode === 'y' || hovermode === 'closest';
}

function getTraceHoverLabelStyle(
	hovermode: string | false,
	bgColor: string,
	traceColor: string
): { bgcolor: string; bordercolor: string } | undefined {
	if (!isNonUnifiedHoverMode(hovermode)) {
		return undefined;
	}

	return {
		bgcolor: toRgba(bgColor, 0.9),
		bordercolor: traceColor
	};
}

function plotly_generator_3d(
	power_matrices: Array<{
		engine: number;
		mode: string;
		matrix: number[][];
		planeName?: string;
		selectionIndex?: number;
	}>,
	chosenplanes_ingame: string[],
	power_unit: string,
	thrust_unit: string,
	weight_unit: string,
	alt_unit: string,
	alt_factor: number,
	speed_factor: number,
	speed_type: string,
	speed_unit: string,
	air_temp: number,
	air_temp_unit: string,
	autoscale: boolean,
	lowest_resp_var: number,
	highest_resp_var: number,
	axis_layout: boolean,
	performance_type: string,
	colour_set: string[],
	bg_col: string,
	vs_mode: boolean = false,
	vs_label: string | null = null
): void {
	const font_fam = 'Inter';
	const isMobileViewport = isMobilePlotViewport();
	const plotTypography = getPlotTypography(isMobileViewport);

	const all_values: number[] = [];
	const traces: any[] = [];

	for (const { engine, mode, matrix, planeName, selectionIndex } of power_matrices) {
		const speedCount = matrix.length;
		const altitudeCount = matrix[0]?.length ?? 0;

		if (speedCount === 0 || altitudeCount === 0) {
			continue;
		}

		const responseMatrix: number[][] = Array.from({ length: altitudeCount }, (_, altIdx) =>
			Array.from({ length: speedCount }, (_, speedIdx) => {
				const value = matrix[speedIdx][altIdx];
				all_values.push(value);
				return value;
			})
		);

		const x = Array.from({ length: speedCount }, (_, speedIdx) =>
			Number(((speedIdx * 10) / speed_factor).toFixed(1))
		);
		const y = Array.from({ length: altitudeCount }, (_, altIdx) =>
			Number(((altIdx * 20) / alt_factor).toFixed(1))
		);

		const displayName = planeName || chosenplanes_ingame[engine] || `Engine ${engine}`;
		const traceName = mode ? `${displayName} (${mode})` : displayName;
		const colourIndex = selectionIndex ?? engine;
		const baseColour = colour_set[colourIndex % colour_set.length];

		const altitudeMatrix: number[][] = Array.from({ length: altitudeCount }, (_, altIdx) =>
			Array.from({ length: speedCount }, () => y[altIdx])
		);

		const speedMatrix: number[][] = Array.from({ length: altitudeCount }, () =>
			Array.from({ length: speedCount }, (_, speedIdx) => x[speedIdx])
		);

		const traceBase = {
			type: 'surface',
			name: traceName,
			showlegend: true,
			opacity: 0.85,
			showscale: false,
			hoverlabel: {
				bgcolor: toRgba(bg_col, 0.9),
				bordercolor: baseColour
			},
			colorscale: [
				[0, toRgba(baseColour, 0.2)],
				[0.4, toRgba(baseColour, 0.45)],
				[1, toRgba(baseColour, 0.95)]
			]
		};

		if (axis_layout) {
			traces.push({
				...traceBase,
				x: speedMatrix,
				y: responseMatrix,
				z: altitudeMatrix,
				hovertemplate:
					`${traceName}<br>${speed_type} Speed: %{x} ${speed_unit}` +
					`<br>${getMetricAxisLabel(performance_type, power_unit, thrust_unit, weight_unit)}: %{y}` +
					`<br>Altitude: %{z} ${alt_unit}` +
					'<extra></extra>'
			});
		} else {
			traces.push({
				...traceBase,
				x,
				y,
				z: responseMatrix,
				hovertemplate:
					`${traceName}<br>${speed_type} Speed: %{x} ${speed_unit}` +
					`<br>Altitude: %{y} ${alt_unit}<br>${getMetricAxisLabel(performance_type, power_unit, thrust_unit, weight_unit)}: %{z}` +
					'<extra></extra>'
			});
		}
	}

	if (traces.length === 0) {
		Plotly.purge('graphid');
		return;
	}

	const { min: rawMinValue, max: rawMaxValue } = getMinMax(all_values);
	const rangePadding = Math.max(
		(rawMaxValue - rawMinValue) * 0.05,
		rawMaxValue === 0 ? 1 : rawMaxValue * 0.01
	);
	const autoAxisMin = getGraphAutoMin(rawMinValue, rangePadding, vs_mode);
	const autoAxisMax = rawMaxValue + rangePadding;
	const manualAxisMin = Number(lowest_resp_var);
	const manualAxisMax = Number(highest_resp_var);
	const hasValidManualRange =
		Number.isFinite(manualAxisMin) &&
		Number.isFinite(manualAxisMax) &&
		(vs_mode || manualAxisMin >= 0) &&
		manualAxisMax > manualAxisMin;
	const useManualRange = !autoscale && hasValidManualRange;
	const effectiveAxisMin = useManualRange ? manualAxisMin : autoAxisMin;
	const effectiveAxisMax = useManualRange ? manualAxisMax : autoAxisMax;

	window.dispatchEvent(
		new CustomEvent('wtapc-power-axis-range', {
			detail: {
				min: autoAxisMin,
				max: autoAxisMax
			}
		})
	);

	const baseMetricLabel = getMetricAxisLabel(performance_type, power_unit, thrust_unit, weight_unit);
	const metricLabel = vs_mode ? `Δ ${baseMetricLabel}` : baseMetricLabel;
	const title = vs_mode
		? `${getMetricTitle(performance_type)} difference (${vs_label ?? 'Plane 1 - Plane 2'}) by altitude and speed`
		: `${getMetricTitle(performance_type)} by altitude and speed`;
	const sceneTickFontSize = isMobileViewport ? 8 : 11;
	const sceneAxisTitleFontSize = isMobileViewport ? 10 : 12;
	const altitudeMaxInUnit = power_matrices[0]?.matrix?.[0]
		? ((power_matrices[0].matrix[0].length - 1) * 20) / alt_factor
		: 0;
	const responseTickInterval = calculateTickInterval(effectiveAxisMin, effectiveAxisMax);
	const altitudeTickInterval = calculateTickInterval(0, altitudeMaxInUnit);

	const layout = {
		uirevision: 'true',
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: {
			text: title,
			font: { size: plotTypography.title },
			x: 0.5,
			y: isMobileViewport ? 0.93 : 0.99,
			yanchor: 'top'
		},
		showlegend: true,
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: plotTypography.legend, family: font_fam },
			title: null
		},
		hoverlabel: {
			font: { color: '#fdfdfde6', size: plotTypography.hover, family: font_fam },
			bordercolor: '#142E40',
			borderwidth: 1
		},
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: plotTypography.margin3d,
		modebar: {
			orientation: isMobileViewport ? 'h' : 'v',
			bgcolor: 'rgba(0,0,0,0)',
			color: 'rgb(205, 215, 225)',
			activecolor: 'rgb(0, 111, 161)',
			font: { size: plotTypography.modebar }
		},
		scene: {
			bgcolor: bg_col,
			aspectmode: 'cube',
				camera: {
					eye: { x: 2, y: -0.8, z: 0.4 }
				},
			xaxis: {
				title: {
					text: `${speed_type} Speed [${speed_unit}]`,
					font: { size: sceneAxisTitleFontSize, color: '#fdfdfde6', family: font_fam }
				},
					autorange: 'reversed',
				gridcolor: 'rgba(47, 62, 73, 0.5)',
				zerolinecolor: 'rgba(47, 62, 73, 0.5)',
				showbackground: true,
				backgroundcolor: bg_col,
				tickfont: { size: sceneTickFontSize, color: '#fdfdfde6' },
				nticks: 6
			},
			yaxis: {
				title: {
					text: axis_layout ? metricLabel : `Altitude [${alt_unit}]`,
					font: { size: sceneAxisTitleFontSize, color: '#fdfdfde6', family: font_fam }
				},
				range: axis_layout ? [effectiveAxisMin, effectiveAxisMax] : [0, altitudeMaxInUnit],
				dtick: axis_layout ? responseTickInterval : altitudeTickInterval,
				gridcolor: 'rgba(47, 62, 73, 0.5)',
				zerolinecolor: 'rgba(47, 62, 73, 0.5)',
				showbackground: true,
				backgroundcolor: bg_col,
				tickfont: { size: sceneTickFontSize, color: '#fdfdfde6' },
				nticks: 6
			},
			zaxis: {
				title: {
					text: axis_layout ? `Altitude [${alt_unit}]` : metricLabel,
					font: { size: sceneAxisTitleFontSize, color: '#fdfdfde6', family: font_fam }
				},
				range: axis_layout ? [0, altitudeMaxInUnit] : [effectiveAxisMin, effectiveAxisMax],
				dtick: axis_layout ? altitudeTickInterval : responseTickInterval,
				gridcolor: 'rgba(47, 62, 73, 0.5)',
				zerolinecolor: 'rgba(47, 62, 73, 0.5)',
				showbackground: true,
				backgroundcolor: bg_col,
				tickfont: { size: sceneTickFontSize, color: '#fdfdfde6' },
				nticks: 6
			}
		},
		annotations: [
			{
				text: `Temperature at sea level: ${air_temp} ${air_temp_unit}`,
				showarrow: false,
				font: { size: plotTypography.annotation },
				x: 0,
				y: 1,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining.",
				opacity: 0.15,
				showarrow: false,
				font: { size: plotTypography.annotation, color: 'white', family: font_fam },
				x: 1,
				y: 0,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'right',
				yanchor: 'bottom'
			}
		]
	};

	const config = {
		scrollZoom: true,
		displayModeBar: true,
		displaylogo: false,
		responsive: true,
		showEditInChartStudio: false,
		plotlyServerURL: 'https://chart-studio.plotly.com',
		toImageButtonOptions: {
			filename: 'performance_plot',
			format: 'png'
		}
	};

	Plotly.purge('graphid');
	sliderChangeListener = null;
	Plotly.react('graphid', traces, layout, config);
}

function isMobilePlotViewport(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	return window.matchMedia('(max-width: 900px)').matches;
}

function getPlotTypography(isMobile: boolean) {
	if (isMobile) {
		return {
			title: 14,
			legend: 10,
			hover: 11,
			modebar: 16,
			annotation: 11,
			axis: 10,
			axisTitle: 10,
			tick: 9,
			sliderCurrent: 11,
			margin: { l: 18, r: 6, b: 16, t: 72, pad: 2 },
			margin3d: { l: 8, r: 8, b: 8, t: 48, pad: 2 }
		};
	}

	return {
		title: 22,
		legend: 14,
		hover: 14,
		modebar: 24,
		annotation: 14,
		axis: 18,
		axisTitle: 18,
		tick: 16,
		sliderCurrent: 16,
		margin: { l: 60, r: 25, b: 65, t: 60, pad: 5 },
		margin3d: { l: 36, r: 16, b: 16, t: 36, pad: 2 }
	};
}

export function plotly_2D_generator(
	power_matrices: Array<{
		engine: number;
		mode: string;
		matrix: number[][];
		planeName?: string;
		selectionIndex?: number;
	}>,
	speed_values: number[],
	chosenplanes_ingame: string[],
	power_unit: string,
	thrust_unit: string,
	weight_unit: string,
	max_alt: number,
	alt_unit: string,
	alt_factor: number,
	speed_factor: number,
	speed_type: string,
	speed_unit: string,
	selected_speed: number,
	air_temp: number,
	air_temp_unit: string,
	autoscale: boolean,
	lowest_resp_var: number,
	highest_resp_var: number,
	axis_layout: boolean,
	performance_type: string,
	colour_set: string[],
	hoverstyle: string,
	bg_col: string,
	vs_mode: boolean = false,
	vs_label: string | null = null,
	show_slider: boolean = true
): void {
	const font_fam = 'Inter';
	const isMobileViewport = isMobilePlotViewport();
	const plotTypography = getPlotTypography(isMobileViewport);
	const effectiveHoverMode = getEffectiveHoverMode(hoverstyle, axis_layout);

	// Define types for our lookup table
	interface TraceData {
		x: number[];
		y: number[];
		planeName: string;
		mode: string;
		engine: number;
		selectionIndex: number;
	}

	interface SpeedLookup {
		[traceKey: string]: TraceData;
	}

	interface Lookup {
		[speedIndex: number]: SpeedLookup;
	}

	// Pre-allocate data structures
	const lookup: Lookup = {};
	const all_values: number[] = [];

	// Process data efficiently with pre-allocated arrays
	power_matrices.forEach(({ engine, mode, matrix, planeName, selectionIndex }) => {
		for (let speedIdx = 0; speedIdx < matrix.length; speedIdx++) {
			// Initialize speed lookup once
			if (!lookup[speedIdx]) {
				lookup[speedIdx] = {};
			}

			// Use planeName in key if provided, otherwise use engine index
			const displayName = planeName || chosenplanes_ingame[engine] || `Engine ${engine}`;
			const traceKey = `${displayName}_${mode}`;

			if (!lookup[speedIdx][traceKey]) {
				// Pre-allocate arrays to the exact size needed
				lookup[speedIdx][traceKey] = {
					x: new Array(matrix[speedIdx].length),
					y: new Array(matrix[speedIdx].length),
					planeName: displayName,
					mode: mode,
					engine: engine,
					selectionIndex: selectionIndex ?? engine
				};
			}

			const trace = lookup[speedIdx][traceKey];
			const speedMatrix = matrix[speedIdx];

			// Batch process altitude data for this speed
			for (let altIdx = 0; altIdx < speedMatrix.length; altIdx++) {
				const powerValue = speedMatrix[altIdx];
				trace.x[altIdx] = powerValue;
				trace.y[altIdx] = (altIdx * 20) / alt_factor;
				all_values.push(powerValue);
			}
		}
	});

	// Get unique speed indices
	const speedIndices = Object.keys(lookup).map(Number);
	speedIndices.sort((a, b) => a - b);

	const selectedSpeedKph = selected_speed * speed_factor;
	const targetSpeedIndex = Math.round(selectedSpeedKph / 10);
	let initialSpeedIndex = speedIndices[0] ?? 0;
	let smallestDistance = Number.POSITIVE_INFINITY;

	for (let i = 0; i < speedIndices.length; i++) {
		const idx = speedIndices[i];
		const distance = Math.abs(idx - targetSpeedIndex);
		if (distance < smallestDistance) {
			smallestDistance = distance;
			initialSpeedIndex = idx;
		}
	}

	const initialSliderStep = Math.max(0, speedIndices.indexOf(initialSpeedIndex));

	// Initial data is from selected speed (e.g. default 300 km/h), not hardcoded 0 km/h
	const firstSpeedData = lookup[initialSpeedIndex];

	// Define trace type
	interface Trace {
		x: number[];
		y: number[];
		mode: string;
		line: { width: number; shape: string; dash: string };
		type: string;
		name: string;
		marker: { color: string };
		hoverinfo: string;
		text: string;
		hoverlabel?: { bgcolor: string; bordercolor: string };
	}

	const traces: Trace[] = [];

	// Create initial traces (more efficiently)
	for (const key in firstSpeedData) {
		const traceData = firstSpeedData[key];
		const { planeName, mode } = traceData;

		// Format the display name
		const displayName = mode ? `${planeName} (${mode})` : planeName;

		const colo_index = traceData.selectionIndex;
		const traceColor = colour_set[colo_index % colour_set.length];

		// In VS mode keep comparison line solid regardless of source mode.
		const dashStyle = vs_mode ? 'solid' : mode === 'WEP' ? 'solid' : 'dash';

		// Create trace without unnecessary array copying
		if (axis_layout) {
			traces.push({
				x: traceData.x, // Direct reference
				y: traceData.y,
				mode: 'lines',
				line: { width: 2, shape: 'linear', dash: dashStyle },
				type: 'linegl',
				name: displayName,
				marker: { color: traceColor },
				hoverinfo: 'x+y+text',
				text: displayName,
				hoverlabel: getTraceHoverLabelStyle(effectiveHoverMode, bg_col, traceColor)
			});
		} else {
			traces.push({
				y: traceData.x,
				x: traceData.y,
				mode: 'lines',
				line: { width: 2, shape: 'linear', dash: dashStyle },
				type: 'linegl',
				name: displayName,
				marker: { color: traceColor },
				hoverinfo: 'x+y+text',
				text: displayName,
				hoverlabel: getTraceHoverLabelStyle(effectiveHoverMode, bg_col, traceColor)
			});
		}
	}

	// Define frame type
	interface Frame {
		name: string;
		data: Array<{ x?: number[]; y?: number[] }>;
	}

	const frames: Frame[] = show_slider ? new Array(speedIndices.length) : [];

	if (show_slider) {
		for (let i = 0; i < speedIndices.length; i++) {
			const speedIdx = speedIndices[i];
			const speedData = lookup[speedIdx];
			const frameData: Array<{ x?: number[]; y?: number[] }> = [];

			for (const key in speedData) {
				const data = speedData[key];

				if (axis_layout) {
					frameData.push({
						x: data.x,
						y: data.y
					});
				} else {
					frameData.push({
						y: data.x,
						x: data.y
					});
				}
			}

			frames[i] = {
				name: speed_values[speedIdx].toString(),
				data: frameData
			};
		}
	}

	// Define slider step type
	interface SliderStep {
		method: string;
		label: string;
		args: [
			string[],
			{
				mode: string;
				transition: { duration: number };
				frame: { duration: number; redraw: boolean };
			}
		];
	}

	const sliderSteps: SliderStep[] = show_slider ? new Array(speedIndices.length) : [];

	if (show_slider) {
		for (let i = 0; i < speedIndices.length; i++) {
			const speedIdx = speedIndices[i];
			const speedKph = speed_values[speedIdx];
			const speedDisplay = (speedKph / speed_factor).toFixed(0);

			sliderSteps[i] = {
				method: 'animate',
				label: speedDisplay,
				args: [
					[speedKph.toString()],
					{
						mode: 'immediate',
						transition: { duration: 0 },
						frame: { duration: 0, redraw: false }
					}
				]
			};
		}
	}

	// Calculate axis ranges from all plotted values (all speeds), preserving decimal precision
	const { min: rawMinValue, max: rawMaxValue } = getMinMax(all_values);
	const rangePadding = Math.max((rawMaxValue - rawMinValue) * 0.05, rawMaxValue === 0 ? 1 : rawMaxValue * 0.01);
	const paddedMinValue = getGraphAutoMin(rawMinValue, rangePadding, vs_mode);
	const paddedMaxValue = rawMaxValue + rangePadding;

	const autoAxisMin = paddedMinValue;
	const autoAxisMax = paddedMaxValue;
	const manualAxisMin = Number(lowest_resp_var);
	const manualAxisMax = Number(highest_resp_var);
	const hasValidManualRange =
		Number.isFinite(manualAxisMin) &&
		Number.isFinite(manualAxisMax) &&
		(vs_mode || manualAxisMin >= 0) &&
		manualAxisMax > manualAxisMin;
	const useManualRange = !autoscale && hasValidManualRange;
	const effectiveAxisMin = useManualRange ? manualAxisMin : autoAxisMin;
	const effectiveAxisMax = useManualRange ? manualAxisMax : autoAxisMax;

	const highest_x = axis_layout ? effectiveAxisMax : max_alt;
	const lowest_x = axis_layout ? effectiveAxisMin : 0;
	const highest_y = axis_layout ? max_alt : effectiveAxisMax;
	const lowest_y = axis_layout ? 0 : effectiveAxisMin;
	const responseMaxAbs = Math.max(Math.abs(effectiveAxisMin), Math.abs(effectiveAxisMax), 1);
	const responseMinAllowed = vs_mode ? -responseMaxAbs * 2 : 0;
	const responseMaxAllowed = responseMaxAbs * 2;

	window.dispatchEvent(
		new CustomEvent('wtapc-power-axis-range', {
			detail: {
				min: autoAxisMin,
				max: autoAxisMax
			}
		})
	);

	// Prepare title and axis labels
	const metricTitle =
		performance_type === 'power'
			? 'Engine power'
			: performance_type === 'power/weight'
				? 'Power / Weight'
				: performance_type === 'thrust'
					? 'Engine thrust'
					: 'Thrust / Weight';
	const title = vs_mode
		? `${metricTitle} difference (${vs_label ?? 'Plane 1 - Plane 2'}) at altitudes`
		: `${metricTitle} at altitudes`;
	const responseAxisLabelPrefix = vs_mode ? 'Δ ' : '';

	const x_axis_title = axis_layout
		? performance_type === 'power'
			? `${responseAxisLabelPrefix}Power [${power_unit}]`
			: performance_type === 'power/weight'
				? `${responseAxisLabelPrefix}Power / Weight [${power_unit}/${weight_unit}]`
				: performance_type === 'thrust'
					? `${responseAxisLabelPrefix}Thrust [${thrust_unit}]`
					: `${responseAxisLabelPrefix}Thrust / Weight [${thrust_unit}/${weight_unit}]`
		: `Altitude [${alt_unit}]`;

	const y_axis_title = axis_layout
		? `Altitude [${alt_unit}]`
		: performance_type === 'power'
			? `${responseAxisLabelPrefix}Power [${power_unit}]`
			: performance_type === 'power/weight'
				? `${responseAxisLabelPrefix}Power / Weight [${power_unit}/${weight_unit}]`
				: performance_type === 'thrust'
					? `${responseAxisLabelPrefix}Thrust [${thrust_unit}]`
					: `${responseAxisLabelPrefix}Thrust / Weight [${thrust_unit}/${weight_unit}]`;

	// Calculate tick intervals once
	const x_axis_tick = calculateTickInterval(lowest_x, highest_x);
	const y_axis_tick = calculateTickInterval(lowest_y, highest_y);

	// Bugwarning positioning based on layout
	const no_bugwarning_angle = axis_layout ? 270 : 0;
	const no_bugwarning_x = 1;
	const no_bugwarning_y = axis_layout ? 0 : -0.008;
	const no_bugwarning_x_anchor = 'right';
	const no_bugwarning_y_anchor = 'bottom';
	const axisTitleXAnnotationX = isMobileViewport ? 1 : 1;
	const axisTitleXAnnotationY = isMobileViewport ? -0.06 : -0.0;
	const axisTitleYAnnotationX = isMobileViewport ? -0.055 : -0.03;
	const axisTitleYAnnotationY = 1;

	// Air temperature info message
	const air_temp_info = `Temperature at sea level: ${air_temp} ${air_temp_unit}`;

	// Create the layout (most settings remain unchanged)
	const layout = {
		uirevision: 'true',
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: {
			text: title,
			font: { size: plotTypography.title },
			x: 0.5,
			y: isMobileViewport ? 0.93 : 0.99,
			yanchor: 'top'
		},
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: plotTypography.legend, family: font_fam },
			title: null
		},
		showlegend: true,
		hoverlabel: {
			font: { color: '#fdfdfde6', size: plotTypography.hover, family: font_fam },
			bordercolor: '#142E40',
			borderwidth: 1
		},
		hovermode: effectiveHoverMode,
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: { ...plotTypography.margin, b: isMobileViewport ? 64 : 100 },
		modebar: {
			orientation: isMobileViewport ? 'h' : 'v',
			bgcolor: 'rgba(0,0,0,0)',
			color: 'rgb(205, 215, 225)',
			activecolor: 'rgb(0, 111, 161)',
			font: { size: plotTypography.modebar },
			add: ['hoverclosest', 'hovercompare'],
			remove: ['autoscale']
		},
		dragmode: 'pan',
		annotations: [
			{
				text: x_axis_title,
				showarrow: false,
				font: { size: plotTypography.axisTitle },
				x: axisTitleXAnnotationX,
				y: axisTitleXAnnotationY,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'right',
				yanchor: 'top'
			},
			{
				text: y_axis_title,
				showarrow: false,
				textangle: -90,
				font: { size: plotTypography.axisTitle },
				x: axisTitleYAnnotationX,
				y: axisTitleYAnnotationY,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'top'
			},
			{
				text: air_temp_info,
				showarrow: false,
				font: { size: plotTypography.annotation },
				x: 0,
				y: 1,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining.",
				opacity: 0.15,
				showarrow: false,
				font: { size: plotTypography.annotation, color: 'white', family: font_fam },
				x: no_bugwarning_x,
				y: no_bugwarning_y,
				xref: 'paper',
				yref: 'paper',
				xanchor: no_bugwarning_x_anchor,
				yanchor: no_bugwarning_y_anchor,
				textangle: no_bugwarning_angle
			}
		],
		xaxis: {
			gridcolor: 'rgba(47, 62, 73, 0.5)',
			gridwidth: 0.4,
			zerolinecolor: 'rgba(47, 62, 73, 0.5)',	
			zerolinewidth: 3,
			maxallowed: axis_layout ? responseMaxAllowed : highest_x * 2,
			minallowed: axis_layout ? responseMinAllowed : 0,
			font: { size: plotTypography.axis, family: font_fam, color: '#fdfdfde6' },
			title: { text: '' },
			range: [lowest_x, highest_x],
			dtick: x_axis_tick,
			ticklabelposition: 'inside',
			ticks: 'inside',
			ticklabelstandoff: 0,
			tickfont: { size: plotTypography.tick }
		},
		yaxis: {
			gridcolor: 'rgba(47, 62, 73, 0.5)',
			gridwidth: 0.4,
			zerolinecolor: 'rgba(47, 62, 73, 0.5)',
			zerolinewidth: 3,
			font: { size: plotTypography.axis, family: font_fam, color: '#fdfdfde6' },
			title: { text: '' },
			range: [lowest_y, highest_y],
			maxallowed: axis_layout ? highest_y * 2 : responseMaxAllowed,
			minallowed: axis_layout ? 0 : responseMinAllowed,
			dtick: y_axis_tick,
			ticklabelposition: 'inside',
			ticks: 'inside',
			ticklabelstandoff: 0,
			tickfont: { size: plotTypography.tick }
		},
		images: [
			{
				x: 0,
				y: 0.0015,
				sizex: 0.11,
				sizey: 0.11,
				source: 'images/WTAPC_logo_nograph_text.png',
				opacity: 0.5,
				xanchor: 'left',
				xref: 'paper',
				yanchor: 'bottom',
				yref: 'paper'
			}
		],
		sliders: show_slider
			? [
					{
						pad: { l: 0, t: 10, b: 6, r: 0 },
						currentvalue: {
							visible: true,
							id: 'speed_annotation',
							prefix: speed_type + ' Speed: ',
							suffix: ' ' + speed_unit,
							xanchor: 'left',
							offset: 0,
							font: { size: plotTypography.sliderCurrent, color: '#fdfdfde6' }
						},
						len: 1,
						x: 0,
						xanchor: 'left',
						steps: sliderSteps,
						tickvals: [0, speedIndices.length - 1],
						ticktext: [
							(speed_values[speedIndices[0]] / speed_factor).toFixed(0),
							(speed_values[speedIndices[speedIndices.length - 1]] / speed_factor).toFixed(0)
						],
						font: { color: '#fdfdfde6' },
						tickcolor: '#fdfdfde6',
						tickwidth: 2,
						active: initialSliderStep
					}
				]
			: []
	};

	// Create the plot config
	const config = {
		scrollZoom: true,
		displayModeBar: true,
		displaylogo: false,
		responsive: true,
		showEditInChartStudio: false,
		plotlyServerURL: 'https://chart-studio.plotly.com',
		toImageButtonOptions: {
			filename: 'performance_plot',
			format: 'png'
		}
	};

	Plotly.purge('graphid');

	if (!show_slider) {
		sliderChangeListener = null;
		Plotly.react('graphid', traces, layout, config);
		return;
	}

	Plotly.newPlot('graphid', {
		data: traces,
		layout,
		frames,
		config
	}).then((graphDiv: any) => {
		if (sliderChangeListener && typeof graphDiv?.removeListener === 'function') {
			graphDiv.removeListener('plotly_sliderchange', sliderChangeListener);
		}

		sliderChangeListener = (event: any) => {
			const selectedFrameName = event?.step?.args?.[0]?.[0];
			const parsedSpeedKph = Number(selectedFrameName);
			if (Number.isFinite(parsedSpeedKph)) {
				const speedInCurrentUnit = Number((parsedSpeedKph / speed_factor).toFixed(1));
				window.dispatchEvent(
					new CustomEvent('wtapc-slider-speed-change', {
						detail: { speed: speedInCurrentUnit }
					})
				);
			}
		};

		if (typeof graphDiv?.on === 'function') {
			graphDiv.on('plotly_sliderchange', sliderChangeListener);
		}
	});
}


