<script lang="ts">
	// if (window.screen.width > window.screen.height){
	//   document.documentElement.style.setProperty('--screen-width', window.screen.width + 'px');
	// }
	// else{
	//   document.documentElement.style.setProperty('--screen-width', window.screen.height + 'px');
	// }

	import { onMount } from 'svelte';

	let power_modes_list = [
		['WEP', 'War Emergency Power. 110% throttle in WT'],
		['military', '100% throttle in WT']
	];

	let speed_types = [
		['IAS', 'Indicated Air Speed'],
		['TAS', 'True Air Speed']
	];

	let speed_units = ['km/h', 'm/s', 'kt', 'mph'];

	let air_temp_units = ['°C', '°F'];

	let alt_units = ['m', 'ft'];

	export let power_modes;
	export let speed_type;
	export let speed;
	export let speed_unit;
	export let max_alt;
	export let alt_unit;
	export let air_temp;
	export let air_temp_unit;
	export let axis_layout;
</script>

<form id="engine_power_form">
	<grid-item id="power_modes"
		>Power Modes: &nbsp
		{#each power_modes_list as power_mode}
			<label class="input-field" title={power_mode[1]}>
				<input type="checkbox" bind:group={power_modes} value={power_mode[0]} />
				{power_mode[0]} &nbsp
			</label>
		{/each}
	</grid-item>

	<grid-item id="speed">
		<label
			>Speed:
			<input
				class="input-field"
				title="Speed inceases critical altitudes via air ram effect"
				type="number"
				style="width:4ch"
				bind:value={speed}
				min="0"
				max="1000"
			/>
		</label>
		&nbsp

		<select class="input-field" bind:value={speed_unit}>
			{#each speed_units as speed_unit}
				<option value={speed_unit}>{speed_unit}</option>
			{/each}
		</select>
	</grid-item>

	<grid-item id="speed_type">
		<label
			>Speed Type: &nbsp
			<select class="input-field" bind:value={speed_type}>
				{#each speed_types as speed_type}
					<option title={speed_type[1]} value={speed_type[0]}>{speed_type[0]}</option>
				{/each}
			</select>
		</label>
	</grid-item>

	<grid-item id="max_alt">
		<label
			>Max Altitude: &nbsp
			<input
				class="input-field"
				type="number"
				style="width:5ch"
				bind:value={max_alt}
				min="0"
				max="20000"
			/>
		</label>
		&nbsp
		<select class="input-field" bind:value={alt_unit}>
			{#each alt_units as alt_unit}
				<option value={alt_unit}>{alt_unit}</option>
			{/each}
		</select>
	</grid-item>

	<grid-item id="axis_layout">
		<label
			>X ⮂ Y axis &nbsp
			<input class="input-field" type="checkbox" bind:checked={axis_layout} />
		</label>
	</grid-item>

	<grid-item id="air_temperature">
		<label
			>Air temp. &nbsp
			<input
				class="input-field"
				type="number"
				style="width:3ch"
				bind:value={air_temp}
				min="0"
				max="100"
			/>
		</label>
		&nbsp
		<select class="input-field" bind:value={air_temp_unit}>
			{#each air_temp_units as air_temp_unit}
				<option value={air_temp_unit}>{air_temp_unit}</option>
			{/each}
		</select>
	</grid-item>
</form>

<style>
	/*###########################################Basic HTML Categories-start##############################################*/

	grid-item {
		color: #b6b8bd;
		/* flex-direction: row; */
		display: flex;
		align-items: center;
		justify-content: center;
		outline: 2px solid transparent;
	}
	input,
	select,
	label {
		cursor: pointer;
		outline: 2px solid transparent;
		transition: outline-color 0.3s;
	}
	input:focus,
	input:hover,
	select:focus,
	select:hover {
		outline: 2px solid #006fa1;
	}

	#engine_power_form {
		display: grid;
		grid-template-rows: repeat(5, min-content);
		grid-template-columns: repeat(4, 1fr);
		text-align: center;
		grid-gap: 0.2rem;
	}

	#power_modes,
	#speed_type,
	#speed,
	#air_temperature,
	#max_alt,
	#axis_layout {
		height: 2rem;
		background-color: #1e262e;
	}

	#power_modes {
		grid-column: 1 / span 4;
		grid-row: 1;
	}

	#speed_type {
		grid-column: 3 / span 2;
		grid-row: 2;
	}
	#speed {
		grid-column: 1 / span 2;
		grid-row: 2;
	}
	#air_temperature {
		grid-column: 3 / span 2;
		grid-row: 4;
	}
	#axis_layout {
		grid-column: 1 / span 2;
		grid-row: 4;
	}

	#max_alt {
		grid-column: 1 / span 4;
		grid-row: 3;
	}

	.input-field {
		font-family: inherit;
		padding: 0 !important;
		border-width: 0;
		text-align: left;
		font-size: inherit;
		color: #fdfdfde6;
		background-color: #1e262e;
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
