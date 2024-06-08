<script lang="ts">
	import Plotly from 'plotly.js-dist';
	import Control_panel from '$lib/control_panel.svelte';
	import Speed_alt_mode from '$lib/input_speed_alt_mode.svelte';
	import Plane_autocomplete from '$lib/plane_autocomplete.svelte';
	import { onMount } from 'svelte';
	import { rameffect_er } from '$lib/ram_pressure_density_calculator.js';
	import { dict_dataframer } from '$lib/graph_maker.js';
	import { plotter } from '$lib/graph_maker.js';

	let bg_col = getComputedStyle(document.body).getPropertyValue('--bg-col');
	let performance_type = 'power/weight';
	let power_modes = ['WEP'];
	let speed_type = 'IAS';
	let speed = 300;
	let speed_unit = 'km/h';
	let max_alt = 10000;
	let alt_unit = 'm';
	let air_temp = 15;
	let air_temp_unit = '°C';
	let axis_layout = false;
	let chosenplanes = [];
	let chosenplanes_ingame = [];
	let fuel_percents = [
		30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
	];
	//   const colour_set = ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)', 'rgb(166,86,40)', 'rgb(247,129,191)', 'rgb(153,153,153)', 'rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)', 'rgb(230,171,2)', 'rgb(166,118,29)', 'rgb(102,102,102)', 'rgb(254,0,206)', 'rgb(34,255,167)'];
	let colour_set = [
		'#E41A1C',
		'#006fa1',
		'#4DAF4A',
		'#984EA3',
		'#E6CF1A',
		'#FF5A00',
		'#A65628',
		'#2EACD4',
		'#999999',
		'#1B9E77',
		'#D95F02',
		'#7570B3',
		'#E7298A',
		'#82C935',
		'#E6AB02',
		'#A6761D',
		'#379100',
		'#FE5ACE',
		'#FF0064'
	];

	let hoverstyle = 'x';
	function form_into_graph_maker() {
		console.log(power_modes)
		if (chosenplanes.length === 0 || power_modes.length < 1 || speed_type == null 
		|| fuel_percents.some((element) => element > 100 || fuel_percents.some((element) => element < 0))){
			return
		}

		let speedkph = speed;
		if (speed_unit === 'mph') {
			speedkph = Math.round(speed * 1.609344);
		} else if (speed_unit === 'kt') {
			speedkph = Math.round(speed * 1.852);
		} else if (speed_unit === 'm/s') {
			speedkph = Math.round(speed * 3.6);
		}

		let max_altm = max_alt;
		let alt_factor = 1;
		if (alt_unit === 'ft') {
			max_altm = Math.round(max_alt * 0.3048);
			alt_factor = 3.28084;
		}

		let air_tempC = air_temp;
		if (air_temp_unit === '°F') {
			air_tempC = (air_temp - 32) / 1.8;
		}
		let named_power_curves_merged: { [key: string]: { [key: string]: { [key: number]: number } } } =
			{}; // Initialize outside the loop

		if (speedkph > 1000 || speedkph < 0 ||max_altm > 20000 || 200 < air_tempC ||air_tempC < -100 ){
			return
		}

		let all_values:any = [];
		let planejsons: any = {};
		let masses: any = {};
		let promises = chosenplanes.map((plane) => {
			let mass_promise = fetch(
				'https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_mass_files/plane_mass_piston.json'
			)
				.then((response) => {
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('Failed to fetch mass data');
					}
				})
				.then((data) => {
					masses = data;
				})
				.catch((error) => {
					console.error(error);
				});

			let plane_promises = power_modes.map((power_mode) => {
				return fetch(
					`https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_power_files/${plane}_${power_mode}.json`
				)
					.then((response) => {
						if (response.ok) {
							return response
								.json()
								.then((plane_power) => ({ plane_power, power_mode: power_mode }));
						} else if (
							Array.isArray(power_modes) &&
							power_modes.length === 1 &&
							power_modes[0] === 'WEP'
						) {
							return fetch(
								`https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_power_files/${plane}_military.json`
							).then((response) => {
								if (response.ok) {
									return response
										.json()
										.then((plane_power) => ({ plane_power, power_mode: 'military' }));
								}
							});
						} else {
							throw new Error(`Failed to fetch data for ${plane}`);
						}
					})
					.then((result) => {
						if (result) {
							const { plane_power, power_mode } = result;
							planejsons[plane + '_' + power_mode] = plane_power;
						}
					})
					.catch((error) => {
						console.error(error);
					});
			});
			return Promise.allSettled([...plane_promises, mass_promise]);
		});

		Promise.allSettled(promises).then(() => {
			console.log(planejsons, chosenplanes)
			for (let file_name in planejsons) {
				let central_name = file_name.substring(0, file_name.lastIndexOf('_'));
				let index = chosenplanes.findIndex((x) => x === central_name);
				let power_curves_merged = {};
				let mode = file_name.slice(file_name.lastIndexOf('_') + 1);
				let speed_mult = planejsons[file_name]['speed_mult'];
				let ingame_name: string = chosenplanes_ingame[index];
				let power_merged_str_noram = planejsons[file_name]['power_at_alt'];
				if (performance_type === 'power') {
					for (let alt = 0; alt < max_altm; alt += 25) {
						let alt_RAM = rameffect_er(alt, air_tempC, speedkph, speed_type, speed_mult);
						power_curves_merged[Math.round(alt * alt_factor)] =
							power_merged_str_noram[Math.round(alt_RAM / 10) + 400];
					}
				} else if (performance_type === 'power/weight') {
					ingame_name = ingame_name + ' [' + fuel_percents[index] + '%]';
					let total_mass =
						masses[central_name]['empty_mass'] +
						masses[central_name]['max_fuel_mass'] * (fuel_percents[index] / 100) +
						masses[central_name]['nitro_mass'] +
						masses[central_name]['oil_mass'] +
						masses[central_name]['pilot_mass'] +
						masses[central_name]['all_ammo_mass'];
					console.log(ingame_name, total_mass, 'kg')
					let engine_count = planejsons[file_name]['engine_count'];
					for (let alt = 0; alt < max_altm; alt += 25) {
						let alt_RAM = rameffect_er(alt, air_tempC, speedkph, speed_type, speed_mult);
						power_curves_merged[Math.round(alt * alt_factor)] =
							(power_merged_str_noram[Math.round(alt_RAM / 10) + 400] / total_mass) * engine_count;
						all_values.push((power_merged_str_noram[Math.round(alt_RAM / 10) + 400] / total_mass) * engine_count)
					}
				}
				// Add data for each plane without overwriting previous data
				named_power_curves_merged[ingame_name] = named_power_curves_merged[ingame_name] || {};
				// named_power_curves_merged[ingame_name][mode] = power_curves_merged;
				if (mode === 'WEP') {
					named_power_curves_merged[ingame_name] = { WEP: power_curves_merged, ...named_power_curves_merged[ingame_name] };
				} else if (mode === 'military') {
					named_power_curves_merged[ingame_name] = { ...named_power_curves_merged[ingame_name], military: power_curves_merged };
				}
			}
			
			let final_data = dict_dataframer(named_power_curves_merged, alt_unit);
			plotter(
				final_data,
				all_values,
				chosenplanes,
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
			);
		});
	}
</script>

<div class="ui">
	<Control_panel bind:performance_type on:GraphRequested={form_into_graph_maker} />

	<Speed_alt_mode
		bind:power_modes
		bind:speed_type
		bind:speed
		bind:speed_unit
		bind:max_alt
		bind:alt_unit
		bind:air_temp
		bind:air_temp_unit
		bind:axis_layout
	/>
	<Plane_autocomplete
		bind:chosenplanes
		bind:chosenplanes_ingame
		bind:fuel_percents
		bind:performance_type
	/>
</div>

<div class="graph" id="graphid" style="height: 100vh"></div>

<style>
	.ui {
		display: grid;
		grid-template-rows: 1;
		grid-template-columns: 1fr;
		padding-top: 0.5rem;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		font-size: 1rem;
		width: 24rem;
	}
	.graph {
		position: fixed;
		top: 0;
		right: 0;
		padding-left: 0;
		height: 100vh;
		float: right;
		width: calc(100% - 25rem);
	}
</style>
