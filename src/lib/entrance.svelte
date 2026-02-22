<div id="calculator_entrance">
	<span id="catchphrase_title">Find the best altitudes<br />for your plane to fight at:</span>
	<!-- <span id='catchphrase_body'>Calculated, flight model based info on<br/>aircraft performance in War Thunder</span> -->
	<span id="catchphrase_body">Performance calculated<br /> from flight models. </span>
	<span id="catchphrase_footer">If you haven't, check out the guide.</span>
	<div id="link_buttons">
		<a class="link-button" id="calculator_link" href="/calculator">
			<img src="images/plot_icon.png" id="graph_img" alt="Icon of an example power plot" />
			<span id="calc_text">Enter the Calculator</span>
		</a>
		<a class="link-button" id="guide_link" href="/guide">
			<img
				src="images/guide_template.png"
				id="graph_img"
				alt="Cover page of a rools royce merlin engine"
			/>
			<span id="guide_text">Enter the Guide</span>
		</a>
	</div>
	<!-- <div  id="link_buttons">
		<a class = link-button2 id="calculator_link2" href="/calculator">
			<span id="calc_text2">Enter the Calculator</span>
		</a>
		<a class = link-button2 id="guide_link2" href="/guide">
			<span id="calc_text2">Enter the Guide</span>
		</a>
	</div> -->
</div>

<style>
	#calculator_entrance {
		display: flex;
		flex-direction: column;
		row-gap: 0.4rem;
		justify-content: center;
		align-items: center;
		margin-bottom: 4rem;
	}
	#link_buttons {
		display: flex;
		column-gap: 4rem;
	}
	#calc_text {
		position: absolute;
		font-size: 1.2rem;
		bottom: 0%;
		left: 50%;
		/* height: 3rem; */
		transform: translateX(-50%);
		color: rgb(205, 215, 225);
		text-decoration: none;
		width: 100%;
		/* background: #c50000; */
	}
	#guide_text {
		position: absolute;
		font-size: 1.2rem;
		bottom: 42%;
		left: 50%;
		/* height: 3rem; */
		transform: translateX(-50%);
		color: #ffffff;
		text-decoration: none;
		width: 80%;
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
		object-fit: cover;
		object-position: 50% 0%;
	}
	.link-button:hover
	/* ,.link-button2:hover */ {
		text-shadow:
			0 0 7px rgb(248, 254, 190),
			0 0 122px rgb(236, 232, 173);
	}

	.link-button {
		position: relative;
		text-align: center;
		display: flex;
		width: 7rem;
		aspect-ratio: 1;
		margin-top: 2rem;
		margin-right: 0.5rem;
	}
</style>
