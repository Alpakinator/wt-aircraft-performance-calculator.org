<script lang="ts">
	import Plane_autocomplete from '$lib/plane_autocomplete.svelte';
	import { makeGraphFromForm } from './graphs.js';

	import { flyAndScale } from '$lib/transitions';
	import CuidaCaretDownOutline from '~icons/cuida/caret-down-outline';
	import AlpaPopover from '$lib/alpa-popover.svelte';
	import AlpaSelect from '$lib/alpa-select.svelte';
	import { Checkbox, Switch, Slider } from 'bits-ui';

	// import MaterialSymbolsLightSync from '~icons/material-symbols-light/update';
	// import MaterialSymbolsLightSyncDisabled from '~icons/material-symbols-light/update-disabled';
	// import MaterialSymbolsLightSyncDisabled from '~icons/material-symbols/sync-disabled';
	// import MaterialSymbolsLightSync from '~icons/material-symbols/sync'
	import MaterialSymbolsLightSyncDisabled from '~icons/material-symbols-light/sync-disabled';
	import MaterialSymbolsLightSync from '~icons/material-symbols-light/sync';
	import RiFullscreenLine from '~icons/ri/fullscreen-line';
	import RiFullscreenExitLine from '~icons/ri/fullscreen-exit-line';

	let performance_type = $state('power/weight');
	let graph_d = '2D';
	let autoscale = $state(true);
	let lowest_resp_var = $state(0);
	let highest_resp_var = $state(0);
	let power_unit = $state('hp');
	let thrust_unit = $state('kgf');
	let weight_unit = $state('kg');
	let power_modes = $state(['WEP']);
	let speed_type = $state('IAS');
	let speed = $state(300);
	let latestAutoAxisMin = $state(0);
	let latestAutoAxisMax = $state(0);
	let stupid = $state([0, 1, 5, 10]);
	let speed_unit = $state('km/h');
	let max_alt = $state(10000);
	let alt_unit = $state('m');
	let air_temp = $state(15);
	let air_temp_unit = $state('°C');
	let axis_layout = $state(false);
	let chosenplanes = $state(['j7w1', 'j7w1:2']);
	let chosenplanes_ingame = $state([]);
	let fuel_percents = $state([]);
	let include_boosters = $state([]);
	let plane_versions = $state(['2.53.0.6', '2.29.0.5']);
	let bg_col = getComputedStyle(document.body).getPropertyValue('--bg-col');

	// let colour_set = [
	// 	'#E41A1C',
	// 	'#006fa1',
	// 	'#4DAF4A',
	// 	'#984EA3',
	// 	'#E6CF1A',
	// 	'#FF5A00',
	// 	'#A65628',
	// 	'#2EACD4',
	// 	'#999999',
	// 	'#1B9E77',
	// 	'#D95F02',
	// 	'#7570B3',
	// 	'#E7298A',
	// 	'#82C935',
	// 	'#E6AB02',
	// 	'#A6761D',
	// 	'#379100',
	// 	'#FE5ACE',
	// 	'#FF0064'
	// ];

	let colour_set = [
		'rgb(228, 26, 28)',
		'rgb(0, 111, 161)',
		'rgb(77, 175, 74)',
		'rgb(152, 78, 163)',
		'rgb(230, 207, 26)',
		'rgb(255, 90, 0)',
		'rgb(166, 86, 40)',
		'rgb(46, 172, 212)',
		'rgb(153, 153, 153)',
		'rgb(27, 158, 119)',
		'rgb(217, 95, 2)',
		'rgb(117, 112, 179)',
		'rgb(231, 41, 138)',
		'rgb(130, 201, 53)',
		'rgb(230, 171, 2)',
		'rgb(166, 118, 29)',
		'rgb(55, 145, 0)',
		'rgb(254, 90, 206)',
		'rgb(255, 0, 100)'
	];

	let isGraphVisible = $state(true);
	let auto_calculation = $state(true);
	let fullscreen_graph = $state(false);
	let isActuallyFullscreen = $state(false);

	let performances = [
		{ value: 'power', label: `💥Power` },
		{ value: 'power/weight', label: '💥Power / ⚖️Weight' },
		{ value: 'thrust', label: `⬅️Thrust` },
		{ value: 'thrust/weight', label: '⬅️Thrust / ⚖️Weight' }
	];
	// let graph_ds = ['2D', '3D(WiP)'];

	let power_modes_list = [
		['WEP', 'War Emergency Power. 110% throttle in WT'],
		['military', '100% throttle in WT']
	];

	let speed_types = ['IAS', 'TAS'];

	let power_units = ['hp', 'kW', 'kcal/s'];
	let thrust_units = ['kgf', 'N', 'lbf', '🐎⬅️'];

	let weight_units = ['kg', 'lb', 'oz', '🐎⚖️'];

	let speed_units = ['km/h', 'm/s', 'kt', 'mph', '🐎💨'];

	let air_temp_units = ['°C', '°F', '°K', '🐎🌡️'];

	let alt_units = ['m', 'ft', 'mile', 'yard', '🐎⬆️'];

	// $inspect({chosenplanes, chosenplanes_ingame, fuel_percents, plane_versions});

	function getSpeedLimitMax(unit) {
		const speedLimitKph =
			performance_type === 'thrust' || performance_type === 'thrust/weight' ? 2000 : 1000;
		const unitToKph = {
			'km/h': 1,
			'm/s': 3.6,
			kt: 1.852,
			mph: 1.609344,
			'🐎💨': 40
		};

		if (!(unit in unitToKph)) {
			return speedLimitKph;
		}

		return Number((speedLimitKph / unitToKph[unit]).toFixed(1));
	}

	function validateSpeed(speed, unit) {
		const max = getSpeedLimitMax(unit);
		return Math.min(Math.max(speed, 0), max);
	}

	$effect(() => {
		const clampedSpeed = validateSpeed(speed, speed_unit);
		if (clampedSpeed !== speed) {
			speed = clampedSpeed;
		}
	});

	function validateAltitude(alt, unit) {
		const limits = {
			m: { min: 1, max: 20000 },
			ft: { min: 1, max: 65616 },
			mile: { min: 0.1, max: 12.4 },
			yard: { min: 1, max: 21872.3 },
			'🐎⬆️': { min: 1, max: 11111.1 }
		};
		return Math.min(Math.max(alt, limits[unit].min), limits[unit].max);
	}

	function validateTemperature(temp, unit) {
		const limits = {
			'°C': { min: -100, max: 100 },
			'°F': { min: -148, max: 212 },
			'°K': { min: 173.15, max: 373.1 },
			'🐎🌡️': { min: -3, max: 3 }
		};
		return Math.min(Math.max(temp, limits[unit].min), limits[unit].max);
	}

	function changeSpeedUnit(event) {
		const newUnit = typeof event === 'string' ? event : event.target.value;
		if (speed_unit === newUnit) return;
		const conversions = {
			'km/h': 1,
			'm/s': 3.6,
			kt: 1.852,
			mph: 1.609344,
			'🐎💨': 40
		};
		if (!(speed_unit in conversions) || !(newUnit in conversions)) return;

		const convertedSpeed = Number(((speed * conversions[speed_unit]) / conversions[newUnit]).toFixed(1));
		speed = validateSpeed(convertedSpeed, newUnit);
		speed_unit = newUnit;
	}

	function changeAltitudeUnit(event) {
		const newUnit = typeof event === 'string' ? event : event.target.value;
		const conversions = {
			m: 1,
			ft: 0.3048,
			mile: 1609.34,
			yard: 0.9144,
			'🐎⬆️': 1.8
		};
		max_alt = Number(((max_alt * conversions[alt_unit]) / conversions[newUnit]).toFixed(1));
		alt_unit = newUnit;
	}

	function changeTemperatureUnit(event) {
		const newUnit = typeof event === 'string' ? event : event.target.value;
		if (air_temp_unit === newUnit) return; // ✅ Early exit without returning a value

		// First convert to Celsius
		let celsius = air_temp;
		if (air_temp_unit === '°F') {
			celsius = (air_temp - 32) / 1.8;
		} else if (air_temp_unit === '°K') {
			celsius = air_temp - 273.15;
		} else if (air_temp_unit === '🐎🌡️') {
			celsius = air_temp * 38;
		}

		// Then convert to target unit
		if (newUnit === '°F') {
			air_temp = Number((celsius * 1.8 + 32).toFixed(1));
		} else if (newUnit === '°K') {
			air_temp = Number((celsius + 273.15).toFixed(1));
		} else if (newUnit === '🐎🌡️') {
			air_temp = Number((celsius / 38).toFixed(1));
		} else {
			air_temp = Number(celsius.toFixed(1));
		}

		air_temp_unit = newUnit; // ✅ Now this always gets executed
	}

	// Utility function for graph throttling
	function createThrottle(func: Function, limit: number) {
		let lastRun = 0;
		let timeout: number | undefined;

		return function (this: void, ...args: any[]) {
			const now = Date.now();

			if (lastRun && now < lastRun + limit) {
				console.log('check1');
				clearTimeout(timeout);
				timeout = window.setTimeout(() => {
					lastRun = now;
					func.apply(this, args);
				}, limit);
			} else {
				console.log('check2');
				lastRun = now;
				func.apply(this, args);
			}
		};
	}

	// Create throttled version of graph maker
	const throttledGraphMaker = createThrottle(() => {
		makeGraphFromForm(
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
		);
	}, 1);
	let tracker = [];
	let skipNextGraphRecalc = false;
	let lastNonSpeedSignature = '';

	function buildNonSpeedSignature() {
		return JSON.stringify({
			performance_type,
			graph_d,
			power_unit,
			thrust_unit,
			weight_unit,
			power_modes,
			speed_type,
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
		});
	}
	// Effect to watch changes
	$effect(() => {
		tracker = fuel_percents.slice();
		const currentNonSpeedSignature = buildNonSpeedSignature();

		if (!auto_calculation) {
			lastNonSpeedSignature = currentNonSpeedSignature;
			return;
		}
		if (skipNextGraphRecalc) {
			const onlySpeedChanged = currentNonSpeedSignature === lastNonSpeedSignature;
			skipNextGraphRecalc = false;
			if (onlySpeedChanged) {
				lastNonSpeedSignature = currentNonSpeedSignature;
				return;
			}
		}

		throttledGraphMaker({
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
		});

		lastNonSpeedSignature = currentNonSpeedSignature;
	});

	function handleAutoscaleToggle(checked: boolean) {
		autoscale = checked;
		if (!checked) {
			if (Number.isFinite(latestAutoAxisMin) && Number.isFinite(latestAutoAxisMax)) {
				lowest_resp_var = Number(latestAutoAxisMin.toFixed(3));
				highest_resp_var = Number(latestAutoAxisMax.toFixed(3));
			}
		}
	}

	const MANUAL_AXIS_MIN_GAP = 0.001;

	function updateManualAxisMin(rawValue: number) {
		if (!Number.isFinite(rawValue)) return;

		lowest_resp_var = Number(Math.max(0, rawValue).toFixed(3));
		if (highest_resp_var <= lowest_resp_var) {
			highest_resp_var = Number((lowest_resp_var + MANUAL_AXIS_MIN_GAP).toFixed(3));
		}
	}

	function updateManualAxisMax(rawValue: number) {
		if (!Number.isFinite(rawValue)) return;

		highest_resp_var = Number(Math.max(0, rawValue).toFixed(3));
		if (highest_resp_var <= lowest_resp_var) {
			highest_resp_var = Number((lowest_resp_var + MANUAL_AXIS_MIN_GAP).toFixed(3));
		}
	}

	function launchFullScreen(element) {
		if (element.requestFullScreen) {
			element.requestFullScreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen();
		}
	}
	interface FullScreenDocument extends Document {
		mozCancelFullScreen?: () => Promise<void>;
		webkitExitFullscreen?: () => Promise<void>;
		msExitFullscreen?: () => Promise<void>;
	}

	interface UnFullScreenDocument extends Document {
		mozFullScreenElement?: () => Promise<void>;
		webkitFullscreenElement?: () => Promise<void>;
		msFullscreenElement?: () => Promise<void>;
	}

	function handleFullscreenToggle(checked: boolean) {
		if (checked) {
			launchFullScreen(document.getElementById('graphid'));
		} else {
			const doc = document as FullScreenDocument;
			if (doc.exitFullscreen) {
				doc.exitFullscreen();
			} else if (doc.mozCancelFullScreen) {
				doc.mozCancelFullScreen();
			} else if (doc.webkitExitFullscreen) {
				doc.webkitExitFullscreen();
			}
		}
	}

	// Add fullscreen change event listener
	$effect(() => {
		const changeFullscreen = () => {
			const doc = document as UnFullScreenDocument;
			isActuallyFullscreen = Boolean(
				doc.fullscreenElement ||
					doc.webkitFullscreenElement ||
					doc.mozFullScreenElement ||
					doc.msFullscreenElement
			);
			fullscreen_graph = isActuallyFullscreen; // Keep the switch state in sync
		};

		document.addEventListener('fullscreenchange', changeFullscreen);
		document.addEventListener('webkitfullscreenchange', changeFullscreen);
		document.addEventListener('mozfullscreenchange', changeFullscreen);
		document.addEventListener('MSFullscreenChange', changeFullscreen);

		return () => {
			document.removeEventListener('fullscreenchange', changeFullscreen);
			document.removeEventListener('webkitfullscreenchange', changeFullscreen);
			document.removeEventListener('mozfullscreenchange', changeFullscreen);
			document.removeEventListener('MSFullscreenChange', changeFullscreen);
		};
	});

	let plotExists = $state(false);

	$effect(() => {
		const onSliderSpeedChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ speed?: number }>;
			const incomingSpeed = customEvent.detail?.speed;
			if (!Number.isFinite(incomingSpeed)) return;

			const nextSpeed = Number(incomingSpeed);
			if (nextSpeed === speed) return;

			skipNextGraphRecalc = true;
			speed = nextSpeed;
		};

		window.addEventListener('wtapc-slider-speed-change', onSliderSpeedChange as EventListener);
		return () => {
			window.removeEventListener(
				'wtapc-slider-speed-change',
				onSliderSpeedChange as EventListener
			);
		};
	});

	$effect(() => {
		const onAxisRangeChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ min?: number; max?: number }>;
			const incomingMin = customEvent.detail?.min;
			const incomingMax = customEvent.detail?.max;
			if (!Number.isFinite(incomingMin) || !Number.isFinite(incomingMax)) return;

			latestAutoAxisMin = Number(incomingMin);
			latestAutoAxisMax = Number(incomingMax);
		};

		window.addEventListener('wtapc-power-axis-range', onAxisRangeChange as EventListener);
		return () => {
			window.removeEventListener('wtapc-power-axis-range', onAxisRangeChange as EventListener);
		};
	});

	// Add effect to watch for plot container
	$effect(() => {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					plotExists = !!document.querySelector('#graphid .plot-container.plotly');
				}
			}
		});

		const graphElement = document.getElementById('graphid');
		if (graphElement) {
			observer.observe(graphElement, { childList: true, subtree: true });
			// Initial check
			plotExists = !!document.querySelector('#graphid .plot-container.plotly');
		}

		return () => observer.disconnect();
	});
</script>

<div class="ui" class:fullscreen={fullscreen_graph}>
	<div class="button-panel">
		<a id="home_button" href="/">
			<img src="images/WTAPC_logo_1280.png" alt="WTAPC logo" />
		</a>

		<!-- <select class ='dimen_button' bind:value={graph_d}>
			{#each graph_ds as graph_d}
				<option id ='toggle_option' value={graph_d}>
					{graph_d}
				</option>
			{/each}
		</select> -->

		<grid-item id="axis_layout">
			<label>
				&nbsp&nbsp&nbsp X ⮂ Y axis &nbsp

				<Checkbox.Root bind:checked={axis_layout} class="b-checkbox-root">
					{#snippet children({ checked })}
						<div class="b-checkbox-indicator">
							{#if checked}
								✓
							{/if}
						</div>
					{/snippet}
				</Checkbox.Root>
			</label>
		</grid-item>
		<grid-item id="auto_calc">
			<Switch.Root class="b-switch-root" bind:checked={auto_calculation}>
				<MaterialSymbolsLightSync id="auto_calcsvg" />
				<MaterialSymbolsLightSyncDisabled id="manual_calcsvg" />
				<Switch.Thumb />
			</Switch.Root>
			<AlpaPopover>
				<MaterialSymbolsLightSync /> - automatic graph generation 25 times/s.<br /> Laggy with
				complex graphs on weak CPUs. <br /> <br />
				<MaterialSymbolsLightSyncDisabled /> - You need to press the button to generate the graph.
			</AlpaPopover>
		</grid-item>
		<!-- <grid-item id="table-graph">
			<Switch.Root class="b-switch-root"
			bind:checked = {isGraphVisible}
			>
				<IconoirGraphDown id='auto_calcsvg' /> <MaterialSymbolsLightMovieInfoOutlineSharp id='manual_calcsvg'/>
				<Switch.Input />
			</Switch.Root>
		</grid-item> -->

		<button
			id="post-form-button"
			disabled={auto_calculation}
			onclick={() =>
				makeGraphFromForm(
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
				)}
		>
			<img
				src="images/plot_icon.png"
				alt="Icon of an example power plot"
				class:rotated={axis_layout}
			/>
			{#if auto_calculation}
				<span id="calculate_text">Graph<br />refresh mode</span>
			{:else}
				<span id="calculate_text">Click&nbspto<br />Graph</span>
			{/if}
		</button>

		<grid-item id="axis_scale">
			<label>
				Auto{axis_layout ? '↔' : '↕'}&nbsp
				<Checkbox.Root
					bind:checked={autoscale}
					onCheckedChange={handleAutoscaleToggle}
					class="b-checkbox-root"
				>
					{#snippet children({ checked })}
						<div class="b-checkbox-indicator">
							{#if checked}
								✓
							{/if}
						</div>
					{/snippet}
				</Checkbox.Root>
			</label>
			&nbsp
			{#if !autoscale}

					<input
						class="input-field"
						title="Fixed minimum value of the power (or power/weight) axis"
						type="number"
						min="0"
						max="30000"
						step="any"
						style="width:5ch"
						bind:value={lowest_resp_var}
						oninput={(e) => {
							const target = e.target as HTMLInputElement | null;
							if (target) {
								updateManualAxisMin(target.valueAsNumber);
							}
						}}
					/>
					&nbsp
					<input
						class="input-field"
						title="Fixed maximum value of the power (or power/weight) axis"
						type="number"
						min="0"
						max="30000"
						step="any"
						style="width:5ch"
						bind:value={highest_resp_var}
						oninput={(e) => {
							const target = e.target as HTMLInputElement | null;
							if (target) {
								updateManualAxisMax(target.valueAsNumber);
							}
						}}
					/>
			{/if}
		</grid-item>
	</div>

	<form id="engine_power_form" style="display: {isGraphVisible ? 'grid' : 'none'}">
		<grid-item id="perf-type">
			<label>
				Graph&nbspType:&nbsp
				<AlpaSelect
					bind:value={performance_type}
					options={performances}
					id="performance-select"
					aria-label="performance metric to graph"
				/>
			</label>

			<AlpaPopover>
				<b>Power</b> - engine power of a single engine of the plane.<br />Useful for finding best
				engines. And for comparing with historical info.
				<br /><br />
				<b>Power/Weight </b> - engine power of all engines of the plane divided by that planes
				weight.<br /> Useful for fiding altitude with best relative performance advantage over an enemy
				plane.
			</AlpaPopover>
		</grid-item>
		<grid-item id="power_unit">
			{#if performance_type === 'power' || performance_type === 'power/weight'}
				<label>
					Power Unit:&nbsp
					<AlpaSelect
						bind:value={power_unit}
						options={power_units}
						id="power-select"
						aria-label="power unit"
					/>
				</label>

				<AlpaPopover>
					1 kW = 1 kJ/s = 1.34102 hp &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; 1 kcal/s = 4.18399 kW
					= 5.61459 hp <br /> <br />
					1 <b>hp</b> (horsepower 🐎⚡️) is power that a draft horse can produce for a prolonged time.
					A very good unit.<br />
					1 <b>kW</b> (kilowatt) is power needed to lift 100kg up 1 meter every second against Earths
					gravity<br />
					(assuming 10N gravity).<br />
					1 <b>kcal/s</b> (kilocalorie/s) is an amount of power that can heat 1l of water up by 1°C
					every second.<br />
				</AlpaPopover>
			{:else}
				<label>
					Thrust Unit:&nbsp
					<AlpaSelect
						bind:value={thrust_unit}
						options={thrust_units}
						id="thrust-select"
						aria-label="thrust unit"
					/>
				</label>

				<AlpaPopover>
					1 kgf = 9.80665 N = 2.20462 lbf = 0.0131506 🐎⬅️
					<br /> <br />
					1 <b>kgf</b> (kilogram-force) is force of gravity on 1 kg at Earth standard gravity.<br />
					1 <b>N</b> (newton) is SI force unit.<br />
					1 <b>lbf</b> (pound-force) is force of gravity on 1 pound at Earth standard gravity.<br />
					1 🐎⬅️(horsethrust) is defined as the force equivalent of 1 horsepower at 1 m/s, so
					1 🐎⬅️= 745.7 N.
				</AlpaPopover>
			{/if}
		</grid-item>
		{#if performance_type === 'power/weight' || performance_type === 'thrust/weight'}
			<grid-item id="weight_unit">
				<label
					>Weight unit:&nbsp
					<AlpaSelect
						bind:value={weight_unit}
						options={weight_units}
						id="weight-select"
						aria-label="weight unit"
					/>
				</label>
				<AlpaPopover>
					1 kg = 2.20462 lb = 35.274 oz = 0.00125 🐎⚖️<br /> <br />

					1 <b>kg</b> is weight of 1l of distilled water at 4°C.<br />
					1 <b>lb</b> (pound) is just 0.45359237 kg. A trash unit.<br />
					1 <b>oz</b> (ounce) is simply 0.028349523125 kg. Another useless unit.<br />
					1 🐎⚖️ (horsemass) is a weight of 1 draft horse (800kg). A very good unit.
				</AlpaPopover>
			</grid-item>
		{/if}
		<grid-item id="power_modes"
			>Throttle: &nbsp
			{#each power_modes_list as power_mode}
				<label title={power_mode[1]}>
					<Checkbox.Root
						checked={power_modes.includes(power_mode[0])}
						onCheckedChange={(checked) => {
							if (checked) {
								power_modes = [...power_modes, power_mode[0]];
							} else {
								power_modes = power_modes.filter((mode) => mode !== power_mode[0]);
							}
						}}
						class="b-checkbox-root"
					>
						{#snippet children({ checked })}
							<div class="b-checkbox-indicator">
								{#if checked}
									✓
								{/if}
							</div>
						{/snippet}
					</Checkbox.Root>
					&nbsp{power_mode[0]} &nbsp
				</label>
			{/each}

			<AlpaPopover>
				<b>WEP</b> (War Emergency Power) is the maximum throttle (110% in WT).<br />
				<b>Military</b> power is 100% throttle in WT.
			</AlpaPopover>
		</grid-item>

		<grid-item id="speed">
			<label
				>Speed: &nbsp
				<input
					class="input-field"
					title="Speed inceases critical altitudes via air ram effect"
					type="number"
					step="10"
					min="0"
					max={getSpeedLimitMax(speed_unit)}
					style="width:7ch"
					bind:value={speed}
					onchange={(e) => {
						const target = e.target as HTMLInputElement | null;
						if (target) {
							speed = validateSpeed(Number(target.value), speed_unit);
						}
					}}
				/>
			</label>
			&nbsp

			<AlpaSelect
				value={speed_unit}
				onValueChange={(value) => {
					changeSpeedUnit(value ?? speed_unit);
				}}
				options={speed_units}
				id="speed-select"
				aria-label="speed unit"
			/>
			&nbsp
			<AlpaSelect
				bind:value={speed_type}
				onValueChange={(value) => {
					speed_type = value ?? speed_type;
				}}
				options={speed_types}
				id="speed_type-select"
				aria-label="speed type"
			/>

			<AlpaPopover>
				1 km/h = 0.277778 m/s = 0.539957 Kt = 0.621371 mph = 0.025 🐎💨<br /><br />
				1 <b>km/h</b> (kilometer per hour) is speed of moving 1 kilometer in 1 hour.<br />
				1 <b>m/s</b> (meter per second) is speed of moving 1 meter in 1 second.<br />
				1 <b>kt</b> (knot) is speed of moving 1 nautical mile in 1 hour (1.852 km/h).<br />
				1 <b>mph</b> (mile per hour) is speed of moving 1 mile in 1 hour. A trash unit.<br />
				1 🐎💨 (horspeed) is a speed of a galloping horse (40km/h). A very good unit.
			</AlpaPopover>
		</grid-item>

		<grid-item id="max_alt">
			<label
				>Max Altitude: &nbsp
				<input
					class="input-field"
					type="number"
					style="width:6ch"
					title="Above sea level"
					bind:value={max_alt}
					onchange={(e) => {
						const target = e.target as HTMLInputElement | null;
						if (target) {
							max_alt = validateAltitude(Number(target.value), alt_unit);
						}
					}}
				/>
			</label>
			&nbsp
			<AlpaSelect
				value={alt_unit}
				onValueChange={(value) => {
					changeAltitudeUnit(value ?? alt_unit);
				}}
				options={alt_units}
				id="alt-select"
				aria-label="altitude unit"
			/>
			<AlpaPopover>
				1 m = 3.28084 ft = 0.000621371 mile = 1.09361 yard = 0.55555 🐎⬆️<br /><br />
				1 <b>m</b> (meter) is the SI length unit.<br />
				1 <b>ft</b> (foot) is exactly 0.3048 m. A weird unit.<br />
				1 <b>mile</b> is exactly 1609.344 m. Abritrary and bad.<br />
				1 <b>yard</b> is exactly 0.9144 m (3 ft). Bad and arbitrary.<br />
				1 🐎⬆️ (horseheight) is a height of a draft horse (1.8m). A very good unit.
			</AlpaPopover>
		</grid-item>

		<grid-item id="air_temperature">
			<label
				>Air temperature: &nbsp
				<input
					class="input-field"
					type="number"
					style="width:4ch"
					title="At sea level"
					bind:value={air_temp}
					onchange={(e) => {
						const target = e.target as HTMLInputElement | null;
						if (target) {
							air_temp = validateTemperature(Number(target.value), air_temp_unit);
						}
					}}
				/>
			</label>
			&nbsp
			<AlpaSelect
				value={air_temp_unit}
				onValueChange={(value) => {
					changeTemperatureUnit(value ?? air_temp_unit);
				}}
				options={air_temp_units}
				id="air_temp-select"
				aria-label="air temperature unit"
			/>
			<AlpaPopover>
				°C = (°F - 32) / 1.8 = °K - 273.15 = 🐎🌡️ × 38<br /><br />

				<b>°C</b> (Celsius) puts water freezing at 0 and boiling at 100 (at sea level).<br />
				<b>°F</b> (Fahrenheit) puts water freezing at 32 and boiling at 212. A trash unit.<br />
				<b>°K</b> (Kelvin) is Celsius shifted by +273.15 and starts at absolute zero.<br />
				🐎🌡️ (horseheat) is an average body temperature of a horse (38°C). A very good unit.
			</AlpaPopover>
		</grid-item>
	</form>

	<Plane_autocomplete
		bind:performance_type
		bind:chosenplanes
		bind:chosenplanes_ingame
		bind:fuel_percents
		bind:include_boosters
		bind:plane_versions
		{colour_set}
	/>
</div>

<div
	class="graph"
	id="graphid"
	class:fullscreen={fullscreen_graph}
	style="display: {isGraphVisible ? 'block' : 'none'}"
>
	{#if plotExists}
		<div id="fullscreen_toggle">
			<Switch.Root
				class="b-switch-root"
				id="fullscreen_switch"
				bind:checked={fullscreen_graph}
				onCheckedChange={handleFullscreenToggle}
			>
				{#if isActuallyFullscreen}
					<RiFullscreenExitLine id="fullscreen-exitsvg" />
				{:else}
					<RiFullscreenLine id="fullscreen-entersvg" />
				{/if}
				<Switch.Thumb />
			</Switch.Root>
		</div>
	{/if}
</div>

<style>
	.ui {
		display: grid;
		grid-template-rows: auto;
		grid-auto-rows: min-content;
		grid-template-columns: 1fr;
		align-content: start;
		justify-content: start;
		align-items: start;
		padding-top: 0.5rem;
		padding-left: 0.5rem;
		padding-right: 0.8rem;
		padding-bottom: 1rem;
		font-size: 1rem;
		width: 26rem;
		height: 100vh;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
	}

	:global(.b-select-dropdown) {
		z-index: 3000;
	}
	.graph {
		position: fixed;
		top: 0;
		left: 26rem;
		right: 0;
		padding-left: 0;
		height: 100vh;
		float: right;
		width: calc(100vw - 26rem);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(html),
	:global(body) {
		overflow: hidden;
	}

	#fullscreen_toggle {
		position: absolute;
		width: auto;
		top: 0.5rem;
		left: 0.2rem;
		z-index: 1000;
	}
	:global(#fullscreen_switch) {
		background-color: transparent;
	}

	:global(#fullscreen-exitsvg),
	:global(#fullscreen-entersvg) {
		width: 2rem;
		height: 2rem;
	}
	.button-panel {
		display: grid;
		grid-template-rows: 1fr 1fr 1fr;
		grid-template-columns: repeat(8, 1fr);
		font-style: Inter;
		padding-bottom: 0.2rem;
		grid-gap: 0.2rem;
	}

	#home_button {
		grid-column: span 2;
		grid-row: span 3;
		aspect-ratio: 1;
		position: relative;
		display: flex;
	}
	#post-form-button {
		grid-column: 7 / 9;
		grid-row: span 3;
		aspect-ratio: 1;
		height: fit-content;
		background-color: var(--bg-col);
	}

	#post-form-button img {
		transition: 0.2s ease;
	}

	#post-form-button img.rotated {
		transform: rotate(90deg) scaleX(-0.99) scaleY(0.99);
	}

	#post-form-button:disabled {
		pointer-events: none;
	}

	#calculate_text {
		position: absolute;
		bottom: 5%;
		left: 50%;
		transform: translateX(-50%);
		color: rgb(205, 215, 225);
		text-decoration: none;
		font-weight: 400;
		font-size: 90%;
	}

	/* .dimen_button, */
	/* #toggle-graph-button, */
	#post-form-button {
		width: 100%;
		display: flex;
		font-size: inherit;
		position: relative;
		text-align: center;
		border: 0;
	}
	/* .dimen_button, */
	/* #toggle-graph-button {
		background-color: rgb(30, 38, 46);
		color: rgb(205, 215, 225);
	} */
	/* .dimen_button {
		grid-column: 2 / 4;
		grid-row: 1;
	} */
	/* #toggle-graph-button {
		grid-column: 6;
		grid-row: 1;
		font-size: 1.1rem;
	} */

	#engine_power_form {
		display: grid;
		grid-template-rows: repeat(5, min-content);
		grid-template-columns: repeat(4, 1fr);
		text-align: center;
		grid-gap: 0.2rem;
	}

	#perf-type {
		grid-row: 1;
		grid-column: 1 / span 4;
		height: 2.6rem;
		background-color: rgb(30, 38, 46);
	}
	:global(#performance-select) {
		width: 12rem;
	}

	:global(#power-select) {
		width: 4.2rem;
	}
	:global(#thrust-select) {
		width: 4.5rem;
	}

	:global(#weight-select) {
		width: 4.5rem;
	}
	:global(#speed-select) {
		width: 4.5rem;
	}
	:global(#speed_type-select) {
		width: 3.5rem;
	}
	:global(#alt-select) {
		width: 4.5rem;
	}
	:global(#air_temp-select) {
		width: 4.5rem;
	}
	#power_unit,
	#weight_unit,
	#power_modes,
	#speed,
	#air_temperature,
	#max_alt {
		height: 2rem;
		background-color: rgb(30, 38, 46);
	}

	#power_unit {
		grid-row: 2;
		grid-column: 1 / span 2;
	}
	#weight_unit {
		grid-row: 2;
		grid-column: 3 / span 2;
	}
	#power_modes {
		grid-row: 3;
		grid-column: 1 / span 4;
		padding-left: 0.5rem;
	}
	#speed {
		grid-column: 1 / span 4;
		grid-row: 4;
	}
	#max_alt {
		grid-column: 1 / span 4;
		grid-row: 5;
	}
	#air_temperature {
		grid-column: 1 / span 4;
		grid-row: 6;
	}
	#axis_layout {
		background-color: rgb(30, 38, 46);
		grid-column: 3 / span 3;
		grid-row: 1;
	}
	#auto_calc {
		background-color: rgb(30, 38, 46);
		grid-column: 5 / span 2;
		grid-row: 2;
	}
	#axis_scale {
		background-color: rgb(30, 38, 46);
		grid-column: 3 / span 4;
		grid-row: 3;
		padding-left: 0;
		display: flex;
		align-items: center;
		gap: 0rem;
	}

	@media (max-width: 900px) {
		.ui {
			position: fixed;
			top: 50dvh;
			left: 0;
			right: 0;
			width: 100vw;
			height: 50dvh;
			padding: 0.4rem;
			padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
			z-index: 2;
			overflow-y: auto;
			overflow-x: hidden;
			overscroll-behavior: contain;
			-webkit-overflow-scrolling: touch;
			--mobile-control-gap: 0.2rem;
			--mobile-panel-padding-x: 0.8rem;
			--mobile-square-size: calc(
				(100vw - var(--mobile-panel-padding-x) - (3 * var(--mobile-control-gap))) / 4
			);
			--mobile-row-height: calc(var(--mobile-square-size) / 3);
		}

		.graph {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			width: 100vw;
			height: 50dvh;
			z-index: 1;
		}

		.button-panel {
			grid-template-columns: repeat(4, 1fr);
			grid-template-rows: repeat(3, var(--mobile-row-height));
			grid-gap: var(--mobile-control-gap);
		}

		#home_button {
			grid-column: 1 / span 1;
			grid-row: 1 / span 3;
			width: 100%;
			height: 100%;
			aspect-ratio: 1 / 1;
		}

		#axis_layout {
			grid-column: 2 / span 2;
			grid-row: 1;
		}

		#auto_calc {
			grid-column: 2 / span 1;
			grid-row: 2;
			width: fit-content;
			min-width: 0;
			height: 100%;
			overflow: hidden;
			display: flex;
			align-items: center;
		}

		#auto_calc :global(.b-switch-root) {
			height: 100%;
			display: inline-flex;
			align-items: center;
			padding-top: 0;
			padding-bottom: 0;
		}

		#auto_calc :global(#auto_calcsvg),
		#auto_calc :global(#manual_calcsvg) {
			width: calc(var(--mobile-row-height) - 0.3rem);
			height: calc(var(--mobile-row-height) - 0.3rem);
		}

		#axis_scale {
			grid-column: 2 / span 2;
			grid-row: 3;
			justify-self: start;
		}

		#post-form-button {
			grid-column: 4;
			grid-row: 1 / span 3;
			width: 100%;
			height: 100%;
			aspect-ratio: 1 / 1;
		}

		#engine_power_form {
			display: flex !important;
			flex-direction: column;
			gap: 0.2rem;
		}

		#perf-type,
		#power_unit,
		#weight_unit,
		#power_modes,
		#speed,
		#max_alt,
		#air_temperature {
			grid-column: auto;
			grid-row: auto;
			height: auto;
			min-height: var(--mobile-row-height);
		}

		#power_modes {
			padding-left: 0.3rem;
			flex-wrap: wrap;
			row-gap: 0.15rem;
		}

		:global(#performance-select) {
			width: 100%;
		}

		:global(#fullscreen_switch) {
			opacity: 0.85;
		}
	}

	@media (max-width: 900px) and (orientation: landscape) {
		:global(:root) {
			--landscape-ui-width: min(26rem, 50vw);
		}

		:global(html),
		:global(body) {
			overflow: hidden;
		}

		.ui {
			position: fixed;
			top: 0;
			left: 0;
			right: auto;
			width: var(--landscape-ui-width);
			height: 100dvh;
			box-sizing: border-box;
			padding: 0.4rem 0.8rem 0.8rem;
			--mobile-control-gap: 0.2rem;
			--mobile-panel-padding-x: 1.6rem;
			--mobile-square-size: calc(
				(var(--landscape-ui-width) - var(--mobile-panel-padding-x) - (3 * var(--mobile-control-gap))) /
					4
			);
			--mobile-row-height: calc(var(--mobile-square-size) / 3);
			z-index: 2;
			overflow-y: auto;
			overflow-x: hidden;
		}

		.graph {
			position: fixed;
			top: 0;
			left: var(--landscape-ui-width);
			right: 0;
			width: calc(100vw - var(--landscape-ui-width));
			height: 100dvh;
			z-index: 1;
		}
	}
	/*For hiding arrows on integer fields*/
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		display: none; /* <- Crashes Chrome on hover??? */
		-webkit-appearance: none;
		margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
	}

	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield; /* Firefox */
	}
</style>
