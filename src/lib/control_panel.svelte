<script>
	export let performance_type = 'power/weight';
	export const graph_d = '2D';
	let performances = [
		{ id: 'power', text: `Power` },
		{ id: 'power/weight', text: 'Power / Weight' },
	];
	// let graph_ds = ['2D', '3D(WiP)'];

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch('GraphRequested');
	}
</script>

<div class="button-panel">
	<a id="home_button" href="/">
		<img src="/images/WTAPC_logo_1280.png" alt="WTAPC logo with Home written on top" />
		<span id="home_text">Home</span>
	</a>

	<!-- <select class ='dimen_button' bind:value={graph_d}>
        {#each graph_ds as graph_d}
            <option id ='toggle_option' value={graph_d}>
                {graph_d}
            </option>
        {/each}
    </select> -->

	<select class="type_button" bind:value={performance_type}>
		{#each performances as performance_type}
			<option id="toggle_option" value={performance_type.id}>
				{performance_type.text}
			</option>
		{/each}
	</select>

	<button id="post-form-button" on:click={handleClick}>
		<img src="/images/plot_icon.png" alt="Icon of an example power plot" />
		<span id="calculate_text">Make&nbspa<br />Graph</span>
	</button>
</div>

<style>
	button,
	select,
	option {
		font-style: Intervar;
		white-space: pre-wrap !important;

		outline: 0.15rem solid transparent;
		transition: outline-color 0.3s;
		cursor: pointer;
	}

	button:hover,
	select:hover,
	#post-form-button:hover {
		outline: 0.15rem solid #006fa1;
	}

	/* .toggle_button.s-QwoIi-GTsD2n{
        white-space: pre-wrap;
    } */

	img {
		max-width: 100%;
		max-height: 100%;
	}

	.button-panel {
		display: grid;
		grid-template-rows: 1fr 1fr;
		grid-template-columns: 25% 25% 25% 25%;
		font-style: Intervar;
		padding: 0;
	}
	#home_button {
		grid-row: span 2;
		position: relative;
		display: flex;
		margin-right: 0.2rem;
		margin-bottom: 0.2rem;
		font-style: Intervar;
		white-space: pre-wrap;
		outline: 0.15rem solid transparent;
		transition: outline-color 0.3s;
		cursor: pointer;
	}
	#post-form-button {
		grid-row: span 2;
	}
	#home_button:hover {
		outline: 0.15rem solid #ff0000;
	}
	/* .overlay-text {
        font-size: inherit;
    } */

	#home_text {
		position: absolute;
		bottom: 0%;
		left: 50%;
		transform: translateX(-50%);
		color: #fdfdfde6;
		text-decoration: none;
		font-weight: 400;
	}

	#calculate_text {
		position: absolute;
		bottom: 5%;
		left: 50%;
		transform: translateX(-50%);
		color: #fdfdfde6;
		text-decoration: none;
		font-weight: 400;
	}

	/* .dimen_button, */
	.type_button,
	#post-form-button {
		display: flex;
		font-size: inherit;
		position: relative;
		text-align: center;
		border: 0;
		margin-right: 0.2rem;
		margin-bottom: 0.2rem;
	}
	/* .dimen_button, */
	.type_button {
		background-color: #1e262e;
		color: #fdfdfde6;
	}
	/* .dimen_button {
		grid-column: 2 / 4;
		grid-row: 1;
	} */
	.type_button {
		grid-column: 2 / 4;
		grid-row: 2;
	}
	/* .toggle_button,  #post-form-button{
        color: #fdfdfde6;
        border: 0;
        background-color: #1E262E;
        font-size: inherit;
        white-space: pre-wrap;
        margin-right: 0.4rem;
        margin-bottom: 0.4rem;
        padding: 0;
    } */
	#toggle_option {
		white-space: pre-wrap;
	}
</style>
