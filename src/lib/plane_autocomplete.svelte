<!-- I know the !important tags are terrible -->

<script lang="ts">
	import central_ingame_planes from '$lib/central-ingame_plane_names_piston_arr.json';
	import image_names from '$lib/vehicle_image_names.json';
	import Svelecte from 'svelecte';
	import planenames from './central-ingame_plane_names_arr.json';
	import planeversions from './oldest_same_fm_dict.json';
	import allversions from './all_versions_list.json';
	import { Select, Button } from 'bits-ui';
	import CuidaCaretDownOutline from '~icons/cuida/caret-down-outline';
	import AlpaTooltip from '$lib/alpa-popover.svelte';
	import AlpaSelect from '$lib/alpa-select.svelte';
	import { DEFAULT_FUEL_PERCENT } from '$lib/calculator_defaults';
	import { getFmJsonUrl } from '$lib/fm_data_url';
	// import type {PlaneData} from './types';
	// export let performance_type: string;

	let {
		chosenplanes = $bindable([]),
		chosenplanes_ingame = $bindable([]),
		fuel_percents = $bindable([]),
		include_boosters = $bindable([]),
		plane_versions = $bindable([]),
		performance_type = $bindable(),
		colour_set = []
	} = $props();

	// Create a derived store for filtered planes
	let filtered_planes = $derived(
		performance_type === 'power/weight' || performance_type === 'power'
			? planenames.piston
			: performance_type === 'thrust' || performance_type === 'thrust/weight'
				? planenames.jet
				: []
	);

	let planeVersionBySelectionId = new Map<string, string>();
	let boosterMetaBySelectionId = $state(
		new Map<string, { hasBooster: boolean; defaultInclude: boolean }>()
	);
	let boosterMetaByFmKey = new Map<string, { hasBooster: boolean; defaultInclude: boolean }>();

	function extractBoosterMetaFromFm(fm: any): { hasBooster: boolean; defaultInclude: boolean } {
		if (!fm || typeof fm !== 'object') {
			return { hasBooster: false, defaultInclude: false };
		}

		const hasEngineTypeSchema = Object.keys(fm).some((key) => /^EngineType\d+$/.test(key));
		const engineKeys = Object.keys(fm).filter((key) =>
			hasEngineTypeSchema ? /^EngineType\d+$/.test(key) : /^Engine\d+$/.test(key)
		);
		let hasBooster = false;
		let hasIntegratedBooster = false;

		for (const engineKey of engineKeys) {
			const engineObj = fm[engineKey];
			if (
				engineObj?.Booster === true &&
				engineObj?.Main?.Type === 'Rocket'
			) {
				hasBooster = true;
				if (engineObj?.External !== true) {
					hasIntegratedBooster = true;
				}
			}
		}

		return {
			hasBooster,
			defaultInclude: hasIntegratedBooster
		};
	}

	async function getBoosterMetaForSelection(
		planeId: string,
		selectedVersion: string
	): Promise<{ hasBooster: boolean; defaultInclude: boolean }> {
		const baseId = planeId.split(':')[0];
		const cacheKey = `${selectedVersion}_${baseId}`;

		if (boosterMetaByFmKey.has(cacheKey)) {
			return boosterMetaByFmKey.get(cacheKey)!;
		}

		try {
			const response = await fetch(getFmJsonUrl(selectedVersion, baseId));
			if (!response.ok) {
				const fallbackMeta = { hasBooster: false, defaultInclude: false };
				boosterMetaByFmKey.set(cacheKey, fallbackMeta);
				return fallbackMeta;
			}

			const fm = await response.json();
			const parsedMeta = extractBoosterMetaFromFm(fm);
			boosterMetaByFmKey.set(cacheKey, parsedMeta);
			return parsedMeta;
		} catch {
			const fallbackMeta = { hasBooster: false, defaultInclude: false };
			boosterMetaByFmKey.set(cacheKey, fallbackMeta);
			return fallbackMeta;
		}
	}

	function getNextDuplicateSuffix(baseId) {
		let maxSuffix = 1;
		for (const planeId of chosenplanes) {
			const [currentBaseId, suffix] = planeId.split(':');
			if (currentBaseId !== baseId) continue;
			if (!suffix) {
				maxSuffix = Math.max(maxSuffix, 1);
				continue;
			}
			const parsedSuffix = Number(suffix);
			if (Number.isFinite(parsedSuffix)) {
				maxSuffix = Math.max(maxSuffix, parsedSuffix);
			}
		}
		return maxSuffix + 1;
	}

	const giveDisplayNamesFromPlaneCodes = (planes) => {
		return planes.map((planeId) => {
			const [baseId, suffix] = planeId.split(':');
			const matchingPlane = filtered_planes.find((plane) => plane.id === baseId);
			const baseName = matchingPlane ? matchingPlane.name : '';
			return suffix ? `${baseName} (${suffix})` : baseName;
		});
	};

	function getVersionOptionsForSelection(planeId: string) {
		const baseId = planeId.split(':')[0];
		const versions = planeversions[baseId] ?? [allversions[0]];
		return generateVersionOptions(versions);
	}

	function getDefaultVersionForSelection(planeId: string): string {
		return getVersionOptionsForSelection(planeId)[0]?.value ?? allversions[0];
	}

	function normalizeVersionForSelection(planeId: string, versionCandidate?: string): string {
		const versionOptions = getVersionOptionsForSelection(planeId);
		if (versionCandidate && versionOptions.some((option) => option.value === versionCandidate)) {
			return versionCandidate;
		}
		return versionOptions[0]?.value ?? allversions[0];
	}

	$effect(() => {
		chosenplanes_ingame = giveDisplayNamesFromPlaneCodes(chosenplanes);

		const nextFuelPercents = chosenplanes.map((_, index) => {
			const rawFuel = Number(fuel_percents[index]);
			if (!Number.isFinite(rawFuel)) {
				return DEFAULT_FUEL_PERCENT;
			}

			return Math.min(Math.max(rawFuel, 0), 100);
		});

		const fuelChanged =
			fuel_percents.length !== nextFuelPercents.length ||
			nextFuelPercents.some((fuelValue, index) => fuel_percents[index] !== fuelValue);

		if (fuelChanged) {
			fuel_percents = nextFuelPercents;
		}

		const nextIncludeBoosters = chosenplanes.map((planeId, index) => {
			const currentValue = include_boosters[index];
			if (typeof currentValue === 'boolean') {
				return currentValue;
			}

			const meta = boosterMetaBySelectionId.get(planeId);
			return meta?.defaultInclude ?? false;
		});

		const boostersChanged =
			include_boosters.length !== nextIncludeBoosters.length ||
			nextIncludeBoosters.some((value, index) => include_boosters[index] !== value);

		if (boostersChanged) {
			include_boosters = nextIncludeBoosters;
		}

		const nextPlaneVersions = chosenplanes.map((planeId, index) => {
			const rememberedVersion = planeVersionBySelectionId.get(planeId);
			const indexedVersion = plane_versions[index];
			const normalizedVersion = normalizeVersionForSelection(
				planeId,
				rememberedVersion ?? indexedVersion
			);
			planeVersionBySelectionId.set(planeId, normalizedVersion);
			return normalizedVersion;
		});

		for (const selectionId of [...planeVersionBySelectionId.keys()]) {
			if (!chosenplanes.includes(selectionId)) {
				planeVersionBySelectionId.delete(selectionId);
			}
		}

		const versionsChanged =
			plane_versions.length !== nextPlaneVersions.length ||
			nextPlaneVersions.some((version, index) => plane_versions[index] !== version);

		if (versionsChanged) {
			plane_versions = nextPlaneVersions;
		}
	});

	$effect(() => {
		let cancelled = false;

		const requestData = chosenplanes.map((planeId, index) => {
			const selectedVersion =
				normalizeVersionForSelection(
					planeId,
					planeVersionBySelectionId.get(planeId) ?? plane_versions[index]
				) ?? allversions[0];
			return { planeId, selectedVersion };
		});

		(async () => {
			const resolved = await Promise.all(
				requestData.map(async ({ planeId, selectedVersion }) => {
					const meta = await getBoosterMetaForSelection(planeId, selectedVersion);
					return { planeId, meta };
				})
			);

			if (cancelled) {
				return;
			}

			const nextMetaMap = new Map<string, { hasBooster: boolean; defaultInclude: boolean }>();
			resolved.forEach(({ planeId, meta }) => {
				nextMetaMap.set(planeId, meta);
			});
			boosterMetaBySelectionId = nextMetaMap;

			const nextIncludeBoosters = chosenplanes.map((planeId, index) => {
				const currentValue = include_boosters[index];
				if (typeof currentValue === 'boolean') {
					return currentValue;
				}

				return nextMetaMap.get(planeId)?.defaultInclude ?? false;
			});

			const boostersChanged =
				include_boosters.length !== nextIncludeBoosters.length ||
				nextIncludeBoosters.some((value, index) => include_boosters[index] !== value);

			if (boostersChanged) {
				include_boosters = nextIncludeBoosters;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	// $effect(() => {

	// });

	function getPlaneColour(index) {
		if (!Array.isArray(colour_set) || colour_set.length === 0) {
			return 'transparent';
		}
		return colour_set[index % colour_set.length];
	}

	function makeIngameIcon(plane, selectionSectionOrTraceColor: boolean | string = false) {
		const traceColor =
			typeof selectionSectionOrTraceColor === 'string'
				? selectionSectionOrTraceColor
				: 'transparent';
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

		if (image_names.includes(plane.id + '.png')) {
			var planeimageUrl = 'images/plane_images/' + plane.id + '.png';
		} else {
			planeimageUrl = 'images/unknown_plane.png';
		}
		// Create WT icon for each plane
		var wt_comp_icon =
			'<div class="WT_icon" style = "position: relative; grid-column: 1 / span 4; grid-row: 1 / span 2; background-color: rgba(47, 62, 73, 1); width: 100%; aspect-ratio: 3.1; height: 100%; border-left: 0.2rem solid ' +
			traceColor +
			';"/>' +
			'<img style ="position: absolute; bottom: 0%; left: 3%; height: 90%; width: auto;" src="' +
			planeimageUrl +
			'" class = "plane_image_WT_icon" alt = ' +
			optionText +
			'/>' +
			'<span style ="position: absolute; text-align: right; top: 2%; right: 3%; width: 75%; height: 80%; white-space: break-spaces; color: rgb(205, 215, 225); font-weight: 450; font-size:0.91rem; font-family: inherit;" class="overlay_text_WT_icon" >' +
			optionText +
			'</span>' +
			'</div>';

		return wt_comp_icon;
	}

	/** @typedef {object} SearchProps
	 *  @property {boolean} [wordsOnly]
	 */

	// Define the props object with the desired property values
	// const searchProps = {
	// 	wordsOnly: true,
	// 	allowEditing: true
	// };
	const searchProps = {
		fields: ['id', 'name', 'nogap'],
		wordsOnly: false // Allow partial word matches
		// conjunction: "and",
	};

	function removePlane(index) {
		planeVersionBySelectionId.delete(chosenplanes[index]);
		boosterMetaBySelectionId.delete(chosenplanes[index]);
		chosenplanes = chosenplanes.filter((_, i) => i !== index);
		fuel_percents = fuel_percents.filter((_, i) => i !== index);
		include_boosters = include_boosters.filter((_, i) => i !== index);
		plane_versions = plane_versions.filter((_, i) => i !== index);
	}

	function duplicatePlane(index) {
		const planeToDuplicate = chosenplanes[index];
		const fuelToDuplicate = fuel_percents[index];
		const boosterToDuplicate = include_boosters[index];
		const versionToDuplicate = normalizeVersionForSelection(
			planeToDuplicate,
			planeVersionBySelectionId.get(planeToDuplicate) ?? plane_versions[index]
		);

		// Get the base ID of the plane (without suffix)
		const baseId = planeToDuplicate.split(':')[0];

		// Always pick the next free numeric suffix based on current selection state
		const nextSuffix = getNextDuplicateSuffix(baseId);
		const newPlaneId = `${baseId}:${nextSuffix}`;

		// Find the last index of the exact base plane (not substring matches)
		let insertIndex = index;
		for (let i = 0; i < chosenplanes.length; i++) {
			const currentPlane = chosenplanes[i];
			const currentBaseId = currentPlane.split(':')[0];
			if (currentBaseId === baseId) {
				insertIndex = i;
			}
		}

		// Insert the new plane after the last found position
		chosenplanes = [
			...chosenplanes.slice(0, insertIndex + 1),
			newPlaneId,
			...chosenplanes.slice(insertIndex + 1)
		];

		fuel_percents = [
			...fuel_percents.slice(0, insertIndex + 1),
			fuelToDuplicate,
			...fuel_percents.slice(insertIndex + 1)
		];

		include_boosters = [
			...include_boosters.slice(0, insertIndex + 1),
			typeof boosterToDuplicate === 'boolean' ? boosterToDuplicate : false,
			...include_boosters.slice(insertIndex + 1)
		];

		plane_versions = [
			...plane_versions.slice(0, insertIndex + 1),
			versionToDuplicate,
			...plane_versions.slice(insertIndex + 1)
		];

		planeVersionBySelectionId.set(newPlaneId, versionToDuplicate);
	}

	function generateVersionOptions(planeFmVersions) {
		const sortedAllVersions = [...allversions].sort((a, b) =>
			b.localeCompare(a, undefined, { numeric: true })
		);
		const sortedFmVersions = [...planeFmVersions].sort((a, b) =>
			b.localeCompare(a, undefined, { numeric: true })
		);

		return sortedFmVersions.map((version, index) => {
			// Latest version - always show range to newest available
			if (index === 0) {
				return {
					value: version,
					label: `v${sortedFmVersions.length}-latest: ${version} - ${sortedAllVersions[0]}`
				};
			}

			const newerVersion = sortedFmVersions[index - 1];
			const newerVersionIndex = sortedAllVersions.indexOf(newerVersion);
			const currentVersionIndex = sortedAllVersions.indexOf(version);

			// Check if versions are neighbors in allversions
			if (currentVersionIndex === newerVersionIndex + 1) {
				// Direct neighbors - show just version
				return {
					value: version,
					label: `v${sortedFmVersions.length - index}: ${version}`
				};
			} else {
				// Not neighbors - show range to version before newer version
				const versionBeforeNewer = sortedAllVersions[newerVersionIndex + 1];
				return {
					value: version,
					label: `v${sortedFmVersions.length - index}: ${version} - ${versionBeforeNewer}`
				};
			}
		});
	}
</script>

<grid-item class="autocomplete_panel">
	<grid-item></grid-item>
	<label id="autocomplete_title">
		Planes:
		<div id="plane_autocomplete">
			<Svelecte
				class="plane-names"
				valueField="id"
				labelField="name"
				multiple
				renderer={makeIngameIcon}
				options={filtered_planes}
				placeholder="Search by typing"
				resetOnSelect={false}
				max={20}
				keepSelectionInList={false}
				strictMode={false}
				deselectMode="native"
				searchable
				collapseSelection="always"
				{searchProps}
				bind:value={chosenplanes}
			></Svelecte>
		</div>
	</label>

	{#each chosenplanes as plane, index (`${plane}-${index}`)}
		<grid-plane class="plane_bar">
			{@html makeIngameIcon(
				{ id: plane.split(':')[0], name: chosenplanes_ingame[index] },
				getPlaneColour(index)
			)}
			{#if performance_type === 'power/weight' || performance_type === 'thrust/weight'}
				<label id="fuel-percent">
					<input
						class="input-field"
						type="number"
						style="width: 3ch"
						bind:value={fuel_percents[index]}
						min="0"
						max="100"
						defaultValue={String(DEFAULT_FUEL_PERCENT)}
						onchange={(e) => {
							const target = e.target as HTMLInputElement | null;
							if (target) {
								fuel_percents[index] = Math.min(Math.max(Number(target.value), 0), 100);
							}
						}}
					/>
					% fuel
				</label>
			{/if}
			{#if (performance_type === 'thrust' || performance_type === 'thrust/weight') &&
				(boosterMetaBySelectionId.get(plane)?.hasBooster ?? false)}
				<label id="booster-toggle">
					<input
						type="checkbox"
						checked={include_boosters[index] ?? false}
						onchange={(e) => {
							const target = e.target as HTMLInputElement | null;
							if (!target) return;

							include_boosters = include_boosters.map((value, includeIndex) =>
								includeIndex === index ? target.checked : (value ?? false)
							);
						}}
					/>
					include boosters
				</label>
			{/if}
			<label id="version-select">
				ver:&nbsp;
				<AlpaSelect
					value={plane_versions[index] || getDefaultVersionForSelection(plane)}
					onValueChange={(value) => {
						const nextVersion = normalizeVersionForSelection(plane, value ?? allversions[0]);
						planeVersionBySelectionId.set(plane, nextVersion);
						plane_versions = plane_versions.map((version, versionIndex) =>
							versionIndex === index ? nextVersion : version
						);
					}}
					options={getVersionOptionsForSelection(plane)}
					style="width: 15rem"
					aria-label="game version"
				/>
				<AlpaTooltip>
					All listed game versions except the lastest are the first releases of the new major
					patches. <br />
					Planes flight models almost always change only between major matches, not during them.<br
					/>
					So "v4: 2.35.0.10 - 2.39.0.8" means this version was realeased in patch 2.35.0.10, was present
					thoughout 2.37 and 2.39. It was changed in the release of 2.41.0.11.
				</AlpaTooltip>
			</label>

			<button class="remove-btn" onclick={() => removePlane(index)}>×</button>
			{#if !plane.includes(':')}
				<button class="add-btn" onclick={() => duplicatePlane(index)}>+</button>
			{/if}
		</grid-plane>
	{/each}
</grid-item>

<style>
	.autocomplete_panel {
		overflow: visible;
		margin-top: 0.2rem;
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: min-content;
		--sv-dropdown-offset: 0.1rem 0;
	}

	#autocomplete_title {
		background-color: rgb(30, 38, 46);
		display: flex;
		grid-column: 1 / span 8;
		grid-row: 2;
		align-self: start;
		border-bottom: 0.2rem solid rgb(13, 17, 22);
	}

	#plane_autocomplete {
		margin-left: auto;
		align-self: right;
		width: 51%;
	}

	.plane_bar {
		border-bottom: 0.5rem solid rgb(13, 17, 22);
		display: grid;
		grid-template-columns: subgrid;
		grid-template-rows: 1fr 1fr 0.7fr;
		grid-gap: 0.08rem;
		position: relative;
		width: 100%;
		/* background-color: rgb(30, 38, 46); */
		text-align: center;
		grid-column: 1 / -1;
	}

	#fuel-percent {
		display: flex;
		align-items: center;
		grid-column: 5 / span 2;
		grid-row: 1;
		background-color: rgb(30, 38, 46);
	}

	#booster-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		grid-column: 7 / span 2;
		grid-row: 1;
		background-color: rgb(30, 38, 46);
		font-size: 85%;
	}

	.remove-btn,
	.add-btn {
		grid-row: 3;
		color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.remove-btn {
		grid-column: 1;
		background-color: rgba(255, 0, 0, 0.4);
	}
	.add-btn {
		grid-column: 2;
		background-color: rgba(0, 111, 161, 0.6);
	}
	.remove-btn:hover {
		background-color: rgba(255, 0, 0, 0.7);
	}
	.add-btn:hover {
		background-color: rgba(0, 111, 161, 1);
	}

	:global(#version-select) {
		font-size: 85%;
		background-color: rgb(30, 38, 46);
		grid-column: 3 / span 6;
		grid-row: 3;
	}
	:global(#version-select-dropdown) {
		font-size: 85%;
	}

	:global(.sv-control--selection.has-items span:first-of-type) {
		display: none;
	}
	:global(.sv-control--selection.has-items) {
		padding-left: 0.5rem;
	}

	input,
	:global(.sv-item--content),
	:global(.sv-input--sizer) {
		outline: 0.1rem solid transparent;
		transition: outline-color 0.2s;
		width: 100%;
	}

	:global(.sv-item--content),
	:global([data-placeholder]:not([data-value])),
	:global(.sv-input--sizer) {
		font-size: 90%;
		color: rgb(174, 177, 184);
	}

	:global(.sv-item--content:hover),
	:global(.sv-control.s-vSkvoVfekCDZ:hover),
	/* :global(.sv-input--sizer.s-vSkvoVfekCDZ:hover), */
	:global(.svelecte.plane-names.s-vSkvoVfekCDZ.is-valid.is-tainted.is-focused), 
	:global(.svelecte.plane-names.s-vSkvoVfekCDZ.is-valid.is-tainted:hover), 
	:global(.sv-item--wrap.in-dropdown.s-vSkvoVfekCDZ.sv-dd-item-active) {
		outline: 0.1rem solid rgba(13, 136, 9, 1);
		cursor: pointer;
	}
	:global(.sv-item--wrap.in-selection.is-multi) {
		padding: 0;
	}

	:global(.sv-buttons.s-vSkvoVfekCDZ) {
		display: none !important;
	}
	:global(.sv-item--wrap) {
		margin: 0.2rem 0.3rem 0rem 0.25rem !important;
	}
	:global(.sv-dropdown-scroll.s-vSkvoVfekCDZ.s-vSkvoVfekCDZ.s-vSkvoVfekCDZ) {
		padding: 0 !important;
	}
	:global(.sv-input--text) {
		color: rgb(174, 177, 184);
	}

	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		/* display: none; <- Crashes Chrome on hover */
		-webkit-appearance: none;
	}

	/* .colour_plane{
		width: 100%;
		background-color: rgb(30, 38, 46);
		text-align: center;
		grid-column: 2;
	} */
	/* :global(.sv-control.s-vSkvoVfekCDZ){
		max-height: 3rem;
	} */

	/* :global(.sv-item--container) {
		order: 1;
		display: none !important; 1frportant;
		padding: 0.2rem 0.2rem !important;
		margin: 0.2rem !important;
	} */

	/* :global(.sv-control--selection.s-vSkvoVfekCDZ.s-vSkvoVfekCDZ.s-vSkvoVfekCDZ) {
		gap: 0 !important;
	} */

	/* :global(.sv-input--sizer.s-vSkvoVfekCDZ) {
		position: relative !important;
		padding: 0.35rem;
	} */
	/* :global(.sv_dropdown.s-vSkvoVfekCDZ) {
		position: absolute;
		left: 11.7rem;
	} */
</style>
