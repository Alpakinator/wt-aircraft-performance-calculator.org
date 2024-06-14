<div class="button-panel">
	<a id="home_img" href="/">
		<img src="/images/WTAPC_logo_1280.png" alt="WTAPC logo with Home written on top" />
	</a>
	<span id="the_title">War Thunder Aircraft Performance Calculator</span>

	<a
		id="discord_button"
		title="WTAPC's Discord Server"
		href="https://discord.gg/6F7ZRk3zJG"
		target="_blank"
		rel="noopener noreferrer"
	>
		<img id="discord_icon" src="/images/discord-mark-white.svg" alt="discord logo" />
	</a>

	<a
		id="github_button"
		title="Calculating Scripts GitHub Repository"
		href="https://github.com/Alpakinator/wt-aircraft-performance-calculator"
		target="_blank"
		rel="noopener noreferrer"
	>
		<img id="github_icon" src="/images/github-mark-white.svg" alt="github logo" />
	</a>

	<!-- "WTAPC_discord.png" -->
</div>

<style>
	.button-panel {
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: auto 1fr auto auto;
		column-gap: 2rem;
		align-items: center;
		justify-content: space-between;
		/* margin-bottom: 2rem; */
		width: 100%;
	}
	#the_title {
		font-variation-settings: 'wght' 200;
		display: flex;
		justify-content: left;
		font-size: 2em;
		/* margin-bottom: 0.5rem; */
	}
	#home_img {
		position: relative;
		display: flex;
		max-height: 6rem;
		max-width: 6rem;
		aspect-ratio: 1;
		margin-right: 0.5rem;
		margin-bottom: 0.5rem;
		outline: 0.15rem solid transparent;
		transition: outline-color 0.3s;
	}
	#home_img:hover{
		outline: 0.15rem solid #ff0000;
	}
	#github_button,
	#discord_button {
		width: 3rem;
		max-height: 4rem;
		opacity: 0.9;
		aspect-ratio: 1;
		position: relative;
		display: flex;
		margin-right: 0.5rem;
		margin-bottom: 0.5rem;
	}
	#github_icon,
	#discord_icon {
		width: 100%;
		aspect-ratio: 1;
		
	}

	/* #github_text{
    font-size: 0.8rem;
    position: absolute;
    top: 5%;
    left: 50%;
    transform: translateX(-50%);
    color: #fdfdfde6;
    text-decoration: none;
  } */
</style>
