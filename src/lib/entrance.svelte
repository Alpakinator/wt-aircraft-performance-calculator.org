<div id="calculator_entrance">
	<span id="catchphrase_title">Find the best altitudes<br />for your plane to fight at:</span>
	<!-- <span id='catchphrase_body'>Calculated, flight model based info on<br/>aircraft performance in War Thunder</span> -->
	<span id="catchphrase_body">Performance calculated<br /> from flight models. </span>
	<span id="catchphrase_footer"
		>If you haven't, check out a guide below<br /> before you enter.</span
	>
	<a id="calculator_link" href="/calculator">
		<img src="/images/plot_icon.png" id="graph_img" alt="Icon of an example power plot" />
		<span id="calc_text">Calculator</span>
	</a>
</div>

<style>
	#calculator_entrance {
		display: flex;
		flex-direction: column;
		row-gap: 0.4rem;
		justify-content: center;
		align-items: center;
		margin-bottom: 2rem;
	}
	#calc_text {
		position: absolute;
		font-size: 1.2rem;
		bottom: 0%;
		left: 50%;
		height: 3rem;
		transform: translateX(-50%);
		color: #fdfdfde6;
		text-decoration: none;
		width: 100%;
		background: #1e262e;
	}
	#catchphrase_title {
		font-variation-settings: 'wght' 700;
		font-size: 2.5rem;
	}
	#catchphrase_body {
		font-variation-settings: 'wght' 400;
		font-size: 1.5rem;
	}
	#catchphrase_footer {
		font-variation-settings: 'wght' 300;
		font-size: 1rem;
	}
	#graph_img {
		width: 100%;
	}
	#graph_img:hover {
		filter: brightness(1.6);
		box-shadow: 0 0 2rem 1rem rgba(255, 255, 255, 0.03);
	}
	#calculator_link:hover {
		text-shadow:
			0 0 7px rgb(248, 254, 190),
			0 0 122px rgb(236, 232, 173);
	}
	#calculator_link {
		position: relative;
		text-align: center;
		display: flex;
		width: 7rem;
		aspect-ratio: 1;
		margin-right: 0.5rem;
		margin-bottom: 0.5rem;
		border: 0.3rem outset #1e262e;
		/* cursor: pointer; */
	}
</style>
