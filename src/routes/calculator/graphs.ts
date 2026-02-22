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

let hoverstyle = 'x';
let sliderChangeListener: ((event: any) => void) | null = null;

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
	const thrAftCoeffGrid: number[][] = Array(altitudeIndices.length)
		.fill(0)
		.map(() => Array(velocityIndices.length).fill(1));

	for (let altPos = 0; altPos < altitudeIndices.length; altPos++) {
		const altIdx = altitudeIndices[altPos];
		for (let velPos = 0; velPos < velocityIndices.length; velPos++) {
			const velIdx = velocityIndices[velPos];
			const coeffRaw = Number(thrustMax[`ThrustMaxCoeff_${altIdx}_${velIdx}`]);
			const thrAftCoeffRaw = Number(thrustMax[`ThrAftMaxCoeff_${altIdx}_${velIdx}`]);
			coeffGrid[altPos][velPos] = Number.isFinite(coeffRaw) ? coeffRaw : 0;
			thrAftCoeffGrid[altPos][velPos] = Number.isFinite(thrAftCoeffRaw) ? thrAftCoeffRaw : 1;
		}
	}

	return {
		altitudeIndices,
		altitudeValues,
		velocityIndices,
		velocityValues,
		coeffGrid,
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

		const multipliers = modeMultipliersByEngine.get(engineKey) ?? getThrustModeMultipliers(engineMain);
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
					matrix[col][row] = Math.max(0, thrustBase * coeff * modeEntry.multiplier * thrAftCoeff);
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
	// Generate x and y values for the graph
	const speed_values = Array.from({ length: speeds }, (_, col) => col * 10);
	const altitude_values = Array.from({ length: Math.floor(max_alt / 20) + 1 }, (_, row) => row * 20);
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
			const pistonEngineKeys = getPistonEngineKeys(fm_dict, engineKeys);
			curveEngineKeys = pistonEngineKeys;

			if (pistonEngineKeys.length === 0) {
				console.warn(`Skipping ${selectionId}: no piston engines found.`);
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
				const summedByMode = new Map<string, { mode: string; matrix: number[][] }>();

				baseMatrices.forEach((matrixObj) => {
					const key = matrixObj.mode;
					const perCurveMultiplier = engineInstancesPerCurve[matrixObj.engine] || 1;

					if (!summedByMode.has(key)) {
						summedByMode.set(key, {
							mode: matrixObj.mode,
							matrix: matrixObj.matrix.map((row) => row.map(() => 0))
						});
					}

					const summed = summedByMode.get(key)!;
					for (let speedIdx = 0; speedIdx < matrixObj.matrix.length; speedIdx++) {
						for (let altIdx = 0; altIdx < matrixObj.matrix[speedIdx].length; altIdx++) {
							summed.matrix[speedIdx][altIdx] +=
								matrixObj.matrix[speedIdx][altIdx] * perCurveMultiplier;
						}
					}
				});

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

	plotly_generator_with_slider(
		allPowerMatrices,
		altitude_values,
		speed_values,
		chosenplanes,
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
		bg_col
	);
}

interface PowerCurve {
	[key: number]: number;
}

interface NamedPowerCurves {
	[key: string]: {
		military?: PowerCurve;
		WEP?: PowerCurve;
	};
}

interface DataFrameRow {
	[key: string]: number[] | number | null | undefined;
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

export function plotly_generator(
	final_data,
	all_values,
	chosenplanes,
	power_unit,
	weight_unit,
	max_alt,
	alt_unit,
	speed,
	speed_type,
	speed_unit,
	air_temp,
	air_temp_unit,
	axis_layout,
	performance_type,
	colour_set,
	hoverstyle,
	bg_col
) {
	// console.log(final_data);
	let font_fam = 'Inter';
	const alt_vals = final_data[0]['Altitude [m]'];
	final_data.shift();
	// console.log(final_data)
	const final_object: {
		x: number;
		y: number;
		mode: string;
		line: { width: number; shape: string; dash: string };
		type: string;
		name: string;
		marker;
		hoverinfo;
		text;
		// hovertemplate;
	}[] = [];

	let highest_x, lowest_x, title, x_axis_title, x_axis_tick;
	let highest_y, lowest_y, y_axis_title, y_axis_tick;
	let no_bugwarning_angle,
		no_bugwarning_x,
		no_bugwarning_y,
		no_bugwarning_x_anchor,
		no_bugwarning_y_anchor;
	let air_temp_info = 'Temperature at sea level: ' + air_temp + ' ' + air_temp_unit;
	let plane: number;
	let colo_index = 0;
	let line_dashes = ['solid', 'dash'];
	const { min: minAllValues, max: maxAllValues } = getMinMax(all_values);
	if (axis_layout) {
		for (const plane in final_data) {
			let dash_index = 0;
			for (const mode in final_data[plane]) {
				let plane_mode = plane + ' (' + mode + ')';
				final_object.push({
					x: final_data[plane][mode],
					y: alt_vals,
					mode: 'lines',
					line: { width: 2, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index] },
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					// "%{text}" +
					// "%{yaxis.title.text}: %{y:}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "<extra></extra>"
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 270;
		no_bugwarning_x = 1;
		no_bugwarning_y = 0;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = maxAllValues;
			lowest_x = minAllValues;
			highest_x = Math.ceil(highest_x * 1.05);
			lowest_x = Math.floor(lowest_x * 0.95);
			if (lowest_x < 0) {
				lowest_x = 0;
			}
			x_axis_title = 'Power [' + power_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
		} else if (performance_type === 'power/weight') {
			title =
				'Power / Weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = maxAllValues;
			lowest_x = minAllValues;
			highest_x = highest_x * 1.05;
			lowest_x = lowest_x * 0.95;
			if (lowest_x < 0) {
				lowest_x = 0;
			}
			x_axis_title = 'Power / Weight [' + power_unit + '/' + weight_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
		}
	} else {
		for (const plane in final_data) {
			let dash_index = 0;
			for (const mode in final_data[plane]) {
				let plane_mode = plane + '(' + mode + ')';
				final_object.push({
					y: final_data[plane][mode],
					x: alt_vals,
					mode: 'lines',
					line: { width: 2, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index] },
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					//         "<b>%{text}</b><br><br>" +
					// "%{yaxis.title.text}: %{y:$,.0f}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "Number Employed: %{marker.size:,}" +
					// "<extra></extra>"
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 0;
		no_bugwarning_x = 1;
		no_bugwarning_y = -0.008;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = maxAllValues;
			lowest_y = minAllValues;
			highest_y = highest_y * 1.05;
			lowest_y = lowest_y * 0.95;
			if (lowest_y < 0) {
				lowest_y = 0;
			}
			y_axis_title = 'Power [' + power_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
		} else if (performance_type === 'power/weight') {
			title =
				'Power / Weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = maxAllValues;
			lowest_y = minAllValues;
			highest_y = highest_y * 1.05;
			lowest_y = lowest_y * 0.95;
			if (lowest_y < 0) {
				lowest_y = 0;
			}
			y_axis_title = 'Power / Weight [' + power_unit + '/' + weight_unit + ']';
			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
		}
	}
	var layout = {
		uirevision: 'true',
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: { text: title, font: { size: 22 }, x: 0.5 },
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: 14, family: font_fam },
			title: null
		},
		showlegend: true,
		hoverlabel: { font: { color: '#fdfdfde6', size: 14 }, bordercolor: '#142E40', borderwidth: 1 },
		hovermode: hoverstyle,
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: { l: 110, r: 25, b: 65, t: 60, pad: 5 },
		modebar: {
			orientation: 'v',
			xanchor: 'left',
			yanchor: 'bottom',
			bgcolor: 'rgba(0,0,0,0)',
			color: 'rgb(205, 215, 225)',
			activecolor: 'rgb(0, 111, 161)',
			font: { size: 24 },
			add: ['hoverclosest', 'hovercompare'],
			remove: ['resetScale2d']
		},
		dragmode: 'pan',
		annotations: [
			{
				text: air_temp_info,
				showarrow: false,
				font: { size: 14 },
				x: 0,
				y: 1,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining forever!",
				opacity: 0.15,
				showarrow: false,
				font: { size: 14, color: 'white', family: font_fam },
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
			gridcolor: 'rgba(47, 62, 73, 0.3)',
			gridwidth: 0.4,
			zerolinecolor: 'rgba(47, 62, 73, 0.3)',
			zerolinewidth: 3,
			maxallowed: highest_x * 2,
			minallowed: 0,
			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
			title: { text: x_axis_title, font: { size: 18 }, standoff: 20 },
			range: [lowest_x, highest_x],
			// autorange: true,
			dtick: x_axis_tick,
			tickfont: { size: 16 }
		},
		yaxis: {
			gridcolor: 'rgba(47, 62, 73, 0.3)',
			gridwidth: 0.4,
			zerolinecolor: 'rgba(47, 62, 73, 0.3)',
			zerolinewidth: 3,
			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
			title: { text: y_axis_title, font: { size: 18 }, standoff: 10 },
			range: [lowest_y, highest_y],
			maxallowed: highest_y * 2,
			minallowed: 0,
			// autorange: true,
			dtick: y_axis_tick,
			tickfont: { size: 16 }
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
		]
	};
	var config = {
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
	// console.log(final_object);
	Plotly.react('graphid', final_object, layout, config);
}

export function plotly_generator_with_slider(
	power_matrices: Array<{
		engine: number;
		mode: string;
		matrix: number[][];
		planeName?: string;
		selectionIndex?: number;
	}>,
	alt_values: number[],
	speed_values: number[],
	chosenplanes: string[],
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
	bg_col: string
): void {
	const font_fam = 'Inter';

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
	}

	const traces: Trace[] = [];

	const line_dashes = ['solid', 'dash'];

	// Create initial traces (more efficiently)
	for (const key in firstSpeedData) {
		const traceData = firstSpeedData[key];
		const { planeName, mode } = traceData;

		// Format the display name
		const displayName = `${planeName} (${mode})`;

		const colo_index = traceData.selectionIndex;

		// Dash style depends on mode
		const dash_index = mode === 'WEP' ? 0 : 1;

		// Create trace without unnecessary array copying
		if (axis_layout) {
			traces.push({
				x: traceData.x, // Direct reference
				y: traceData.y,
				mode: 'lines',
				line: { width: 2, shape: 'linear', dash: line_dashes[dash_index] },
				type: 'linegl',
				name: displayName,
				marker: { color: colour_set[colo_index % colour_set.length] },
				hoverinfo: 'x+y+text',
				text: displayName
			});
		} else {
			traces.push({
				y: traceData.x,
				x: traceData.y,
				mode: 'lines',
				line: { width: 2, shape: 'linear', dash: line_dashes[dash_index] },
				type: 'linegl',
				name: displayName,
				marker: { color: colour_set[colo_index % colour_set.length] },
				hoverinfo: 'x+y+text',
				text: displayName
			});
		}
	}

	// Define frame type
	interface Frame {
		name: string;
		data: Array<{ x?: number[]; y?: number[] }>;
	}

	// Create frames efficiently
	const frames: Frame[] = new Array(speedIndices.length);

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

	// Create slider steps efficiently
	const sliderSteps: SliderStep[] = new Array(speedIndices.length);

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

	// Calculate axis ranges from all plotted values (all speeds), preserving decimal precision
	const { min: rawMinValue, max: rawMaxValue } = getMinMax(all_values);
	const rangePadding = Math.max((rawMaxValue - rawMinValue) * 0.05, rawMaxValue === 0 ? 1 : rawMaxValue * 0.01);
	const paddedMinValue = Math.max(0, rawMinValue - rangePadding);
	const paddedMaxValue = rawMaxValue + rangePadding;

	const autoAxisMin = paddedMinValue;
	const autoAxisMax = paddedMaxValue;
	const manualAxisMin = Number(lowest_resp_var);
	const manualAxisMax = Number(highest_resp_var);
	const hasValidManualRange =
		Number.isFinite(manualAxisMin) &&
		Number.isFinite(manualAxisMax) &&
		manualAxisMin >= 0 &&
		manualAxisMax > manualAxisMin;
	const useManualRange = !autoscale && hasValidManualRange;
	const effectiveAxisMin = useManualRange ? manualAxisMin : autoAxisMin;
	const effectiveAxisMax = useManualRange ? manualAxisMax : autoAxisMax;

	const highest_x = axis_layout ? effectiveAxisMax : max_alt;
	const lowest_x = axis_layout ? effectiveAxisMin : 0;
	const highest_y = axis_layout ? max_alt : effectiveAxisMax;
	const lowest_y = axis_layout ? 0 : effectiveAxisMin;

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
	const title = `${metricTitle} at different altitudes (use slider to change airspeed)`;

	const x_axis_title = axis_layout
		? performance_type === 'power'
			? `Power [${power_unit}]`
			: performance_type === 'power/weight'
				? `Power / Weight [${power_unit}/${weight_unit}]`
				: performance_type === 'thrust'
					? `Thrust [${thrust_unit}]`
					: `Thrust / Weight [${thrust_unit}/${weight_unit}]`
		: `Altitude [${alt_unit}]`;

	const y_axis_title = axis_layout
		? `Altitude [${alt_unit}]`
		: performance_type === 'power'
			? `Power [${power_unit}]`
			: performance_type === 'power/weight'
				? `Power / Weight [${power_unit}/${weight_unit}]`
				: performance_type === 'thrust'
					? `Thrust [${thrust_unit}]`
					: `Thrust / Weight [${thrust_unit}/${weight_unit}]`;

	// Calculate tick intervals once
	const x_axis_tick = calculateTickInterval(lowest_x, highest_x);
	const y_axis_tick = calculateTickInterval(lowest_y, highest_y);

	// Bugwarning positioning based on layout
	const no_bugwarning_angle = axis_layout ? 270 : 0;
	const no_bugwarning_x = 1;
	const no_bugwarning_y = axis_layout ? 0 : -0.008;
	const no_bugwarning_x_anchor = 'right';
	const no_bugwarning_y_anchor = 'bottom';

	// Air temperature info message
	const air_temp_info = `Temperature at sea level: ${air_temp} ${air_temp_unit}`;

	// Create the layout (most settings remain unchanged)
	const layout = {
		uirevision: 'true',
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: { text: title, font: { size: 22 }, x: 0.5 },
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: 14, family: font_fam },
			title: null
		},
		showlegend: true,
		hoverlabel: { font: { color: '#fdfdfde6', size: 14 }, bordercolor: '#142E40', borderwidth: 1 },
		hovermode: hoverstyle,
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: { l: 110, r: 25, b: 100, t: 60, pad: 5 },
		modebar: {
			orientation: 'v',
			xanchor: 'left',
			yanchor: 'bottom',
			bgcolor: 'rgba(0,0,0,0)',
			color: 'rgb(205, 215, 225)',
			activecolor: 'rgb(0, 111, 161)',
			font: { size: 24 },
			add: ['hoverclosest', 'hovercompare'],
			remove: ['resetScale2d']
		},
		dragmode: 'pan',
		annotations: [
			{
				text: air_temp_info,
				showarrow: false,
				font: { size: 14 },
				x: 0,
				y: 1,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining forever!",
				opacity: 0.15,
				showarrow: false,
				font: { size: 14, color: 'white', family: font_fam },
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
			maxallowed: highest_x * 2,
			minallowed: 0,
			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
			title: { text: x_axis_title, font: { size: 18 }, standoff: 20 },
			range: [lowest_x, highest_x],
			dtick: x_axis_tick,
			tickfont: { size: 16 }
		},
		yaxis: {
			gridcolor: 'rgba(47, 62, 73, 0.5)',
			gridwidth: 0.4,
			zerolinecolor: 'rgba(47, 62, 73, 0.5)',
			zerolinewidth: 3,
			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
			title: { text: y_axis_title, font: { size: 18 }, standoff: 10 },
			range: [lowest_y, highest_y],
			maxallowed: highest_y * 2,
			minallowed: 0,
			dtick: y_axis_tick,
			tickfont: { size: 16 }
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
		updatemenus: [
			{
				x: 0,
				y: 0,
				yanchor: 'top',
				xanchor: 'left',
				showactive: false,
				direction: 'left',
				type: 'buttons',
				pad: { t: 87, r: 10 }
			}
		],
		sliders: [
			{
				pad: { l: 0, t: 30, b: 10, r: 0 },
				currentvalue: {
					visible: true,
					id: 'speed_annotation',
					prefix: speed_type + ' Speed: ',
					suffix: ' ' + speed_unit,
					xanchor: 'left',
					offset: 5,
					font: { size: 16, color: '#fdfdfde6' }
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

	// Create the plot with all data
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


