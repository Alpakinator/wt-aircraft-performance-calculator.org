<!-- I know the !important tags are terrible -->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import central_ingame_planes from '$lib/central-ingame_plane_names_piston_arr.json';
	import Svelecte from 'svelecte';
	export let chosenplanes;
	export let chosenplanes_ingame;
	export let fuel_percents;
	export let performance_type;
	let chosenplanes_fuel;
	
	const PlaneIDsToNamesmapper = (planes) => {
		return planes.map((planeId) => {
			const matchingPlane = central_ingame_planes.find((plane) => plane.id === planeId);
			return matchingPlane ? matchingPlane.name : '';
		});
	};

	$: chosenplanes_ingame = PlaneIDsToNamesmapper(chosenplanes);
	function ingame_icon_maker(plane) {
		var optionText = plane.name;
		
		if (
			[
				'p-63a-10',
				'p-63a-10_ussr',
				'p-63a-5',
				'p-63a-5_ussr',
				'p-63c-5',
				'p-63c-5_france',
				'p-63c-5_kingcobra_animal_version',
				'p-63c-5_ussr',
				'tu-1'
			].includes(plane.id)
		) {
			optionText = plane.name + ' INACCURATE!';
		}
		// var backgrimageUrl = "images/item_own_2.png";
		var planeimageUrl = 'images/plane_images/' + plane.id + '.png';
		// Create WT icon for each plane
		var wt_comp_icon =
			'<div class="WT_icon" style = "position: relative; background-color: #2F3E49; width: 11rem; aspect-ratio: 1/0.309878; height: auto;"/>' +
			'<img style ="position: absolute; bottom: 0%; left: 3%; height: 90%; width: auto;" src="' +
			planeimageUrl +
			'" class = "plane_image_WT_icon" alt = ' +
			optionText +
			'/>' +
			'<span style ="position: absolute; text-align: right; top: 0%; right: 3%; width: 75%; height: 80%; white-space: break-spaces; color: #fdfdfde6; font-weight: 450; font-size:0.9rem; font-family: inherit;" class="overlay_text_WT_icon" >' +
			optionText +
			'</span>' +
			'</div>';
		return wt_comp_icon;
	}
	/** @typedef {object} SearchProps
	 *  @property {boolean} [wordsOnly]
	 */

	// Define the props object with the desired property values
	const searchProps = {
		wordsOnly: true,
		allowEditing: true
	};
</script>

<div class="autocomplete_panel">
	<grid-item id="autocomplete_title">Planes to plot: </grid-item>

	<grid-item id="plane_autocomplete">
		<Svelecte
			class="plane-names"
			multiple
			renderer={ingame_icon_maker}
			options={central_ingame_planes}
			placeholder="Search by typing"
			resetOnSelect={false}
			max={20}
			keepSelectionInList={false}
			searchable
			bind:value={chosenplanes}
		></Svelecte>
	</grid-item>
	<!-- {#each chosenplanes as plane, index}
			<grid-item class="colour_plane">
			</grid-item>
		{/each} -->
	{#if performance_type === 'power/weight'}
		<grid-item id="fuel_percent_label" style="display:flex;"> % of max fuel: </grid-item>

		{#each chosenplanes as plane, index}
			<grid-item class="fuel_percent">
				<input
					class="input-field"
					type="number"
					style="width: 3ch"
					bind:value={fuel_percents[index]}
					min="0"
					max="100"
				/>
				<!-- <button on:click={() => removePlane(index)}>Remove</button> -->
			</grid-item>
		{/each}
	{/if}
</div>

<style>
	input,
	:global(.sv-item--content),
	:global(.sv-input--sizer.svelte-hi60qz) {
		outline: 0.15rem solid transparent;
		transition: outline-color 0.3s;
	}
	input:focus,
	input:hover,
	:global(.sv-item--content:hover),
	:global(.sv-input--sizer.svelte-hi60qz:hover) {
		outline: 0.15rem solid #006fa1;
	}

	grid-item {
		color: #b6b8bd;
		flex-direction: row;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: 0.15rem solid transparent;
	}

	.input-field {
		font-family: inherit;
		padding: 0 !important;
		border-width: 0;
		/*background-color: #111111;*/
		/*color: ;*/
		text-align: left;
		font-size: inherit;
		color: #fdfdfde6;
		background-color: #1e262e;
	}
	.autocomplete_panel {
		display: grid;
		row-gap: 0.2rem;
		grid-template-columns: 50% 0.2rem 12.5% 12.5% 12.5% 12.5%;
		grid-template-rows: 1.5rem 1.8rem repeat(40, 3.412rem);
	}
	/* #autocomplete_title{
    grid-column:1 / span 1;
    grid-row: 1;
    } */

	#fuel_percent_label {
		display: flex;
		grid-column: 3;
		grid-row: 1 / span 2;
	}

	#plane_autocomplete {
		grid-column: 1;
		grid-row: 2 / span 40;
		align-self: start;
		background-color: #111111;
	}

	/* .colour_plane{
		width: 100%;
		background-color: #1e262e;
		text-align: center;
		grid-column: 2;
	} */

	:global(.sv-control.svelte-hi60qz) {
		background-color: #1e262e !important;
		border: 0 !important;
		border-radius: 0 !important;
	}

	:global(.sv-buttons.svelte-hi60qz) {
		display: none !important;
	}

	:global(.sv-item--container.svelte-hi60qz) {
		order: 1;

		/* position: relative!important; */
	}
	:global(.sv-item--btn) {
		/* align-self: flex-start; */
		position: absolute !important;
		color: rgba(255, 255, 255, 0.8) !important;
		background-color: rgba(255, 0, 0, 0.4) !important;
		padding: 0.2rem 0.2rem !important;
		margin: 0.2rem !important;
	}

	:global(.sv-item--wrap) {
		padding: 0.1rem 0.1rem 0.1rem 0.2rem !important;
		/* border: 0.2rem solid!important; */
		/* padding-bottom: 0.2rem!important; */
		background-color: #1e262e !important;
	}

	:global(.sv-control--selection.svelte-hi60qz.svelte-hi60qz.svelte-hi60qz) {
		gap: 0 !important;
		padding: 0 !important;
	}

	:global(.sv-dropdown-scroll.svelte-hi60qz.svelte-hi60qz.svelte-hi60qz) {
		padding: 0rem !important;
	}

	:global(.sv-input--sizer.svelte-hi60qz) {
		position: relative !important;
		padding: 0.35rem;
		/* border: 0.2rem solid #006FA1; */
	}
	:global(.sv-input--text.svelte-hi60qz) {
		color: #b6b8bd;
	}

	:global(.sv_dropdown.svelte-hi60qz) {
		background-color: #1e262e !important;
		border: 0 !important;
		border-radius: 0 !important;
		position: absolute;
		left: 11.7rem;
		top: 1.83rem;
		overflow-x: visible !important;
		overflow-y: visible !important;
	}
	.fuel_percent {
		width: 100%;
		background-color: #1e262e;
		text-align: center;
		grid-column: 3;
	}

	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		/* display: none; <- Crashes Chrome on hover */
		-webkit-appearance: none;
	}
</style>
