<script lang="ts">
	import Plane_autocomplete from '$lib/plane_autocomplete.svelte';
	import { form_into_graph_maker, form_into_graph_maker_new } from './graph_maker.js';

	import { flyAndScale } from '$lib/transitions';
	import CuidaCaretDownOutline from '~icons/cuida/caret-down-outline';
	import AlpaTooltip from '$lib/alpa-tooltip.svelte';
	import { Select, Checkbox, Switch, Slider } from 'bits-ui';

import MaterialSymbolsLightUpdate from '~icons/material-symbols-light/update'
import MaterialSymbolsLightUpdateDisabled from '~icons/material-symbols-light/update-disabled'
import MaterialSymbolsLightMovieInfoOutlineSharp from '~icons/material-symbols-light/movie-info-outline-sharp'
import IconoirGraphDown from '~icons/iconoir/graph-down'

	let performance_type = $state('power/weight');
	let graph_d = '2D';
	let power_unit = $state('hp');
	let weight_unit = $state('kg');
	let power_modes = $state(['WEP']);
	let speed_type = $state('IAS');
	let speed = $state(300);
	let stupid = $state([0, 1, 5, 10])
	let speed_unit = $state('km/h');
	let max_alt = $state(10000);
	let alt_unit = $state('m');
	let air_temp = $state(15);
	let air_temp_unit = $state('°C');
	let axis_layout = $state(false);
	let chosenplanes = $state([]);
	let chosenplanes_ingame = $state([]);
	let fuel_percents = $state([]);
	let plane_versions  = $state([]);
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
		'#rgb(117, 112, 179)',
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

	let performances = [
		{ value: 'power', label: `Power` },
		{ value: 'power/weight', label: 'Power / Weight' }
	];
	// let graph_ds = ['2D', '3D(WiP)'];

	let power_modes_list = [
		['WEP', 'War Emergency Power. 110% throttle in WT'],
		['military', '100% throttle in WT']
	];

	let speed_types = [
		['IAS', 'Indicated Air Speed'],
		['TAS', 'True Air Speed']
	];

	let power_units = ['hp', 'kW', 'kcal/s'];

	let weight_units = ['kg', 'lb', 'oz', '🐎⚖️'];

	let speed_units = ['km/h', 'm/s', 'kt', 'mph', '🐎💨'];

	let air_temp_units = ['°C', '°F', '°K', '🐎🌡️'];

	let alt_units = ['m', 'ft', 'mile', 'yard', '🐎⬆️'];


	// $inspect({chosenplanes, chosenplanes_ingame, fuel_percents, plane_versions});


	function validateSpeed(speed, unit) {
		const limits = {
			'km/h': { min: 0, max: 3000 },
			'm/s': { min: 0, max: 833.3 },
			kt: { min: 0, max: 1619.9 },
			mph: { min: 0, max: 1864.1 },
			'🐎💨': { min: 0, max: 75 }
		};
		return Math.min(Math.max(speed, limits[unit].min), limits[unit].max);
	}

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

	function convertTemperature(value, fromUnit, toUnit) {
		if (fromUnit === toUnit) return value;

		// First convert to Celsius
		let celsius = value;
		if (fromUnit === '°F') {
			celsius = (value - 32) / 1.8;
		} else if (fromUnit === '°K') {
			celsius = value - 273.15;
		} else if (fromUnit === '🐎🌡️') {
			celsius = value * 38;
		}

		// Then convert to target unit
		if (toUnit === '°F') {
			return Number((celsius * 1.8 + 32).toFixed(1));
		} else if (toUnit === '°K') {
			return Number((celsius + 273.15).toFixed(1));
		} else if (toUnit === '🐎🌡️') {
			return Number((celsius / 38).toFixed(1));
		}
		return Number(celsius.toFixed(1));
	}

	// Add handlers for unit changes
	function handleSpeedUnitChange(event) {
		const newUnit = typeof event === 'string' ? event : event.target.value;
		const conversions = {
			'km/h': 1,
			'm/s': 3.6,
			kt: 1.852,
			mph: 1.609344,
			'🐎💨': 40
		};
		speed = Number(((speed * conversions[speed_unit]) / conversions[newUnit]).toFixed(1));
		speed_unit = newUnit;
	}

	function handleAltUnitChange(event) {
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

	function handleTempUnitChange(event) {
		const newUnit = typeof event === 'string' ? event : event.target.value;
		air_temp = convertTemperature(air_temp, air_temp_unit, newUnit);
		air_temp_unit = newUnit;
	}

	// Utility function for throttling
	function createThrottle(func: Function, limit: number) {
	let lastRun = 0;
	let timeout: number | undefined;

	return function(this: void, ...args: any[]) {
		const now = Date.now();
		
		if (lastRun && now < lastRun + limit) {
			console.log('check1')
		clearTimeout(timeout);
		timeout = window.setTimeout(() => {
			lastRun = now;
			func.apply(this, args);
		}, limit);
		} else {
		console.log('check2')
		lastRun = now;
		func.apply(this, args);
		}
	}
	}

	// Create throttled version of graph maker
	const throttledGraphMaker = createThrottle(() => {
	form_into_graph_maker(
		performance_type,
		graph_d,
		power_unit,
		weight_unit,
		power_modes,
		speed_type,
		speed,
		speed_unit,
		max_alt,
		alt_unit,
		air_temp,
		air_temp_unit,
		axis_layout,
		chosenplanes,
		chosenplanes_ingame,
		fuel_percents,
		plane_versions,
		colour_set,
		bg_col
	);
	}, 40);
	let tracker = []
	// Effect to watch changes
	$effect.pre(() => {
	tracker = fuel_percents.slice() 

	if (!auto_calculation) return;
	
	throttledGraphMaker({
		performance_type,
		graph_d,
		power_unit,
		weight_unit,
		power_modes,
		speed_type,
		speed,
		speed_unit,
		max_alt,
		alt_unit,
		air_temp,
		air_temp_unit,
		axis_layout,
		chosenplanes,
		chosenplanes_ingame,
		fuel_percents,
		plane_versions,
		colour_set,
		bg_col
	});
	});

	
</script>

<div class="ui">
	<div class="button-panel">
		<a id="home_button" href="/">
			<img src="/images/WTAPC_logo_1280.png" alt="WTAPC logo" />
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
					<Checkbox.Indicator let:isChecked class="b-checkbox-indicator">
						{#if isChecked}
							✓
						{/if}
					</Checkbox.Indicator>
					<Checkbox.Input />
				</Checkbox.Root>
			</label>
		</grid-item>
		<grid-item id="auto_calc">
			<Switch.Root class="b-switch-root"
			bind:checked = {auto_calculation}
			>
				<MaterialSymbolsLightUpdate id='auto_calcsvg' /> <MaterialSymbolsLightUpdateDisabled id='manual_calcsvg'/>
				<Switch.Input />
			</Switch.Root>
			<AlpaTooltip>
				<MaterialSymbolsLightUpdate /> - automatic graph generation 25 times/s.<br /> Laggy with complex graphs on weak CPUs. <br /> <br />
				<MaterialSymbolsLightUpdateDisabled /> - You need to press the button to generate the graph.

			</AlpaTooltip>
		</grid-item>
		<Switch.Root class="b-switch-root"
		bind:checked = {isGraphVisible}
		>
			<IconoirGraphDown id='auto_calcsvg' /> <MaterialSymbolsLightMovieInfoOutlineSharp id='manual_calcsvg'/>
			<Switch.Input />
		</Switch.Root>

		<button
			id="post-form-button"
			disabled={auto_calculation}
			onclick={() =>
				form_into_graph_maker_new(
					performance_type,
					graph_d,
					power_unit,
					weight_unit,
					power_modes,
					speed_type,
					speed,
					speed_unit,
					max_alt,
					alt_unit,
					air_temp,
					air_temp_unit,
					axis_layout,
					chosenplanes,
					chosenplanes_ingame,
					fuel_percents,
					plane_versions,
					colour_set,
					bg_col
				)}
		>
			<img
				src="/images/plot_icon.png"
				alt="Icon of an example power plot"
				class:rotated={axis_layout}
			/>
			{#if auto_calculation}
				<span id="calculate_text">Graph<br />refresh mode</span>
			{:else}
				<span id="calculate_text">Generate<br />a&nbspGraph</span>
			{/if}
			
		</button>
	</div>

	<form id="engine_power_form" style="display: {isGraphVisible ? 'grid' : 'none'}">
		<grid-item id="perf-type">
			<Select.Root
				selected={performances[1]}
				onSelectedChange={(value) => (performance_type = value?.value ?? performance_type)}
			>
				<Select.Trigger
					id="performance-select"
					class="b-select-field"
					aria-label="performance metric to graph"
				>
					<Select.Value />
					<CuidaCaretDownOutline class="caret-svg" />
				</Select.Trigger>
				<Select.Content class="b-select-dropdown">
					{#each performances as performance}
						<Select.Item class="b-select-item" value={performance.value}>
							{performance.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<AlpaTooltip>
				
			<b>Power</b> - engine power of a single engine of the plane.<br />Useful for finding best engines. And for comparing with historical info.
			<br /><br />
			<b>Power/Weight </b> - engine power of all engines of the plane divided by that planes weight.<br /> Useful for fiding altitude with best relative performance advantage over an enemy plane.
				
			</AlpaTooltip>
		</grid-item>
		<grid-item id="power_unit">
			<label>
				Power Unit:&nbsp
				<Select.Root
					selected={{ value: power_unit, label: power_unit }}
					onSelectedChange={(value) => (power_unit = value?.value ?? power_unit)}
				>
					<Select.Trigger
						id="power-select"
						class="b-select-field"
						aria-label="performance metric to graph"
					>
						<Select.Value />
						<CuidaCaretDownOutline class="caret-svg" />
					</Select.Trigger>
					<Select.Content class="b-select-dropdown">
						{#each power_units as power_unit}
							<Select.Item class="b-select-item" value={power_unit}>
								{power_unit}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</label>

			<AlpaTooltip>
				
				1 kW = 1 kJ/s = 1.34102 hp &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; 1 kcal/s = 4.18399
				kW = 5.61459 hp <br /> <br />
				<b>1 hp</b> (horsepower 🐎⚡️) is power that a draft horse can produce for a prolonged
				time. A very good unit.<br />
				<b>1 kW</b> (kilowatt) is power needed to lift 100kg up 1 meter every second against
				Earths gravity<br />
				(assuming 10N gravity).<br />
				<b>1 kcal/s</b> (kilocalorie/s) is an amount of power that can heat 1l of water up by 1°C
				every second.<br />
				
			</AlpaTooltip>
		</grid-item>
		{#if performance_type === 'power/weight'}
			<grid-item id="weight_unit">
				<label
					>Weight unit:&nbsp
					<Select.Root
						selected={{ value: weight_unit, label: weight_unit }}
						onSelectedChange={(value) => (weight_unit = value?.value ?? weight_unit)}
					>
						<Select.Trigger
							id="weight-select"
							class="b-select-field"
							aria-label="performance metric to graph"
						>
							<Select.Value />
							<CuidaCaretDownOutline class="caret-svg" />
						</Select.Trigger>
						<Select.Content class="b-select-dropdown">
							{#each weight_units as weight_unit}
								<Select.Item class="b-select-item" value={weight_unit}>
									{weight_unit}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</label>
				<AlpaTooltip>
					1 kg = 2.20462 lb = 35.274 oz = 0.00125 🐎⚖️<br /> <br />

					<b>1 kg</b> is weight of 1l of distilled water at 4°C.<br />
					<b>1 lb</b> (pound) is just 0.45359237 kg. A trash unit.<br />
					<b>1 oz</b> (ounce) is simply 0.028349523125 kg. Another useless unit.<br />
					1 🐎⚖️ (horseweight) is a weight of 1 draft horse (800kg). A very good unit.
				</AlpaTooltip>
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
							power_modes = power_modes.filter(mode => mode !== power_mode[0]);
						}
					}}
					class="b-checkbox-root"
				>
					<Checkbox.Indicator let:isChecked class="b-checkbox-indicator">
						{#if isChecked}
							✓
						{/if}
					</Checkbox.Indicator>
					<Checkbox.Input />
				</Checkbox.Root>
				&nbsp{power_mode[0]} &nbsp
			</label>
		{/each}

		<AlpaTooltip>
				
			<b>WEP</b> (War Emergency Power) is a maximum throttle the engine can run at.<br />
			<b>military</b> power is 100% throttle in War Tunder.
			
		</AlpaTooltip>
		</grid-item>

		<grid-item id="speed">
			<label
				>Speed: &nbsp
				<input
					class="input-field"
					title="Speed inceases critical altitudes via air ram effect"
					type="number"
					style="width:5ch"
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

			<Select.Root
				selected={{ value: speed_unit, label: speed_unit }}
				onSelectedChange={(value) => {
					handleSpeedUnitChange(value?.value ?? speed_unit);
				}}
			>
				<Select.Trigger
					id="speed-select"
					class="b-select-field"
					aria-label="performance metric to graph"
				>
					<Select.Value />
					<CuidaCaretDownOutline class="caret-svg" />
				</Select.Trigger>
				<Select.Content class="b-select-dropdown">
					{#each speed_units as speed_unit}
						<Select.Item class="b-select-item" value={speed_unit}>
							{speed_unit}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			&nbsp
			<Select.Root
				selected={{ value: speed_type, label: speed_type }}
				onSelectedChange={(value) => (speed_type = value?.value ?? speed_type)}
			>
				<Select.Trigger
					id="speed_type-select"
					class="b-select-field"
					aria-label="performance metric to graph"
				>
					<Select.Value />
					<CuidaCaretDownOutline class="caret-svg" />
				</Select.Trigger>
				<Select.Content class="b-select-dropdown">
					{#each speed_types as speed_type}
						<Select.Item class="b-select-item" value={speed_type[0]}>
							{speed_type[0]}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			
			<AlpaTooltip>
				1 km/h = 0.277778 m/s = 0.539957 Kt = 0.621371 mph = 0.025 🐎💨<br /><br />
				<b>1 km/h</b> <br />
				<b>1 m/s</b> <br />
				<b>1 kt</b> <br />
				<b>1 mph</b> <br />
				1 🐎💨 (horspeed) is a galloping horse speed (40km/h). A very good unit.
				
			</AlpaTooltip>
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
			<Select.Root
				selected={{ value: alt_unit, label: alt_unit }}
				onSelectedChange={(value) => {
					handleAltUnitChange(value?.value ?? alt_unit);
				}}
			>
				<Select.Trigger
					id="alt-select"
					class="b-select-field"
					aria-label="performance metric to graph"
				>
					<Select.Value />
					<CuidaCaretDownOutline class="caret-svg" />
				</Select.Trigger>
				<Select.Content class="b-select-dropdown">
					{#each alt_units as alt_unit}
						<Select.Item class="b-select-item" value={alt_unit}>
							{alt_unit}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<AlpaTooltip>
				
				1 m = 3.28084 ft = 0.000621371 mile = 1.09361 yard = 0.55555 🐎⬆️<br /><br />
				<b>1 m</b> <br />
				<b>1 ft</b> <br />
				<b>1 mile</b> <br />
				<b>1 yard</b> <br />
				🐎⬆️ (horseheight) is a height of a draft horse (1.8m). A very good unit.
				
			</AlpaTooltip>
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
			<Select.Root
				selected={{ value: air_temp_unit, label: air_temp_unit }}
				onSelectedChange={(value) => {
					handleTempUnitChange(value?.value ?? air_temp_unit);
				}}
			>
				<Select.Trigger
					id="air_temp-select"
					class="b-select-field"
					aria-label="performance metric to graph"
				>
					<Select.Value />
					<CuidaCaretDownOutline class="caret-svg" />
				</Select.Trigger>
				<Select.Content class="b-select-dropdown">
					{#each air_temp_units as air_temp_unit}
						<Select.Item class="b-select-item" value={air_temp_unit}>
							{air_temp_unit}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<AlpaTooltip>
				°C = <br /><br />

				<b>°C</b> <br />
				<b>°F</b> <br />
				<b>°K</b> <br />
				🐎🌡️ (horseheat) is a height of a draft horse (1.8m). A very good unit.
			</AlpaTooltip>
		</grid-item>
	</form>

	<Plane_autocomplete
		bind:performance_type
		bind:chosenplanes
		bind:chosenplanes_ingame
		bind:fuel_percents
		bind:plane_versions
	/>
</div>

<div class="graph" id="graphid" style="display: {isGraphVisible ? 'block' : 'none'}"></div>

<style>
	.ui {
		display: grid;
		grid-template-rows: 1;
		grid-template-columns: 1fr;
		padding-top: 0.5rem;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		padding-bottom: 20rem;
		font-size: 1rem;
		width: 23.5rem;
	}
	.graph {
		position: absolute;
		top: 0;
		right: 0;
		padding-left: 0;
		height: 100vh;
		float: right;
		width: calc(100% - 23.5rem);
		overflow: visible;
	}

	.button-panel {
		display: grid;
		grid-template-rows: 1fr 1fr 1fr;
		grid-template-columns: repeat(8, 1fr);
		font-style: Inter;
		padding: 0;
		grid-gap: 0.2rem;
		border-bottom: 0.4rem;
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
	#post-form-button{
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
		height: 2.5rem;
		background-color: rgb(30, 38, 46);
	}
	:global(#performance-select) {
		width: 9rem;
	}

	:global(#power-select) {
		width: 4.2rem;
	}

	:global(#weight-select) {
		width: 3.5rem;
	}
	:global(#speed-select) {
		width: 4rem;
	}
	:global(#speed_type-select) {
		width: 3rem;
	}
	:global(#alt-select) {
		width: 3.5rem;
	}
	:global(#air_temp-select) {
		width: 3.5rem;
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
