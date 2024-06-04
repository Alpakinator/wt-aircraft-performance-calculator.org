<script>
	import Bugcat from '$lib/bugcat.svelte';
</script>

<div id="guide_whole">
	<span id="guide_title">Guide👇</span> <br />
	<span id="use_example">
		<h1>What can you do with Power/Weight graphs alone?</h1>
		<br />
		<h2>
		1. Find altitudes at which you have the highest chance of winning an energy fight or running.
		</h2>
		<h3>Example:</h3>
		You're in Bf 109 G-2 and you're chased by Spitfire F Mk IX at 4.5km altitude. You're always faster
		but your team is losing and you can't run forever. So you need to start energy trapping and fighting the Spitfire. 
    You need a serious energy advantage, because G-2 is much less maneuverable.
		<br /><br />
		<h3>Question:</h3>
		Is 4500m a good altitude to start doing this?
		<br /><br />
		<h3>Checking:</h3>
		Enter the Calculator in another tab. Click on 'Click and type' search bar. Select Bf 109 G-2 and
		Spitfire F Mk IX. Give G-2 25% and Spitfire 40% fuel as that's their typical fuel 5-10min into the
		game. Choose a speed of 550kph TAS. Then click on 'Make a Graph' button.<br /><br />
		You'll see a graph where G-2 has higher power/weight than the Spitfire up to 8000m. However, you'll
		notice they are actually close at 4500m. That's where the Spitfire reached the critical altitude of
		its 1st supercharger gear and only stared to lose power. The situation looks much better at around 6km and also 3km.
    But consider that the actual fight will not happen at 600kph TAS but likely around in 150-400kph IAS range.
    So, if you remake the graph with 300kph IAS you'll notice everything moved down by ~500m at high altitude and by ~1000m at low altitude.
		It's because previously high speed increased critical altitudes via air ram effect, so keep that in mind.
		<br /><br />
		<h3>Conclusion:</h3>
		4.5km is clearly a bad altitude to  energy fight the Spitfire at high speed. 5500 - 6400m is much better.
		At low speed 5000 - 5900m is optimal, not higher. Alternatively you can dive and try to engage at
		2000-3000m
		<br /><br />
    <h2>2. Choose between similar planes:</h2>
    <h3>Example:</h3>
    You're grinding P-51 tree and deciding which ones to play and which ones to skip. They all have similar airframe aerodynamics and propeller efficiencies.
		<h3>Question:</h3>
		Which P-51 is best relative to their Br?
		<br /><br />
		<h3>Checking:</h3>
		Select All US tree P-51s. Give them all 30% fuel because that; the minimum you can choose in game and it's more than enough. 
		You can leave speed at 300kph IAS - a typical dogfighting speed/ upper range of climb speeds. 
		After you make the graph you'll see that that they differ quite a bit.
		You can click on names of planes in the graph legend to hide them and click again to show them.
		<br /><br />
		<h3>Conclusion:</h3>
    <ul>
      <li>P-51 - Bad power/weight, and starts losing power at 2km already. However at 3.7 it has great cannons and it's pretty fast so it's an mediocre choice.</li>
      <li>P-51C-10 - By far the best power/weight relative to its Br aut of all P-51s. 
        It's the best choice performance wise especialy since it's the most lightweight, so it dogfights decently.</li> 
      <li>P-51D-5 and D-20 - A bad power to weight for 4.0 br. Definitely the worst P-51s to fly in.</li>
      <li> P-51D-10 - A good increase in power/weight over D-5. A very good choice.</li>
      <li>P-51D-30 - A nice increase over D-10 but it's not worth the 0.7 Br increase. A good choice.</li>
      <li>P-51H-5 - Yup, a huge difference in performance over all P-51s. Very good pick even for a 6.3 Br.</li>
    </ul>
	Great, but you'll quickly notice that all P-51s have low power/weight compared to planes like Bf 109s, La-7, Ki-84. 
	The difference on the graphs is larger than ingame climb rate difference. 
	The reason is; P-51s have great propeller efficiency compared to La-7, Bf 109 or Ki-84, which remedies their sub-par power/weight. This is explored below:

  <h1>What can you do with power/weight graphs with context?</h1>
		<h2>Choose between quite different planes.</h2>
		<h3>Example:</h3>
		You're grinding Swedish tech tree and want to get a premium plane or talisman one. Bf-109 G-6 and VL Pyörremyrsky are considered good planes in the WT community. 
		G-6 is faster while Pyörremyrsky is much more maneuverable.
		<br /><br />
		<h3>Question:</h3>
		Is Bf 109 G-6 or Pyörremyrsky a better plane for its Br?
		<br /><br />
		<h3>Checking:</h3>
		Select Bf 109 G-6 and VL Pyörremyrsky. Give Pyörremyrsky 32% and G-6 42% fuel because then they have similar flight time. 
		You can leave speed at 290kph IAS - a upper range of climb speeds - more optimal for G-6 than Pyörremyrsky. 
    	When you make a power/weight graph you will notice that G-6 has significantly higher power/weight than Pyörremyrsky up to 5km. 
		So you might say "Oh wow, G-6 must climb so much better!". Unfortunately no, because Pyörremyrsky has a much more efficient propeller. 
		To clarify this, take a look at these 4 graphs:
		<img id="prop_eff_graph" src="/images/g-6_vs_pyo.png" alt="Graph of power/weight, prop efficiency, thrust/weight and climb rate of Bf 109 G-6 and VL Pyoremyrrsky" />
		
		The graphs except power/weight were collected in game, while climbing in both aircraft at 290 kph IAS in test flight. 
		The power/weight graph was made with WTAPC and it matches power/weight from test flight perfectly.
		<br /><br />
		You can clearly see that Bf 109 G-6 indeed climbs better than Pyörremyrsky up to 5km, but only slighly. The advantage is much smaller than power/weight would suggest. 
		However, now compare climb rate with thrust/weight and you'll see these graphs look similar. 
		It's because thrust/weight is the actual force that pulls the aircraft forward - it takes into accunt propeller efficiency and speed.
		That's why the next goal for WTAPC is to implement propeller efficiency and thrust/weight. Thrust/weight takes propeller efficiency into account.
		<br /><br />
		<h3>Conclusion:</h3>
		VL Pyörremyrsky is better plane for it's Br than Bf 109 G-6 as it climbs better at high altitude and is more maneuverable.
		It's because VL Pyörremyrsky has a better propeller than Bf 109 G-6. 
		As a result it has similar climb rate at low altitude and superior at high altitude, despite a weaker engine. 
		So when comparing planes via power/weight keep in mind their other parameters. 
		Aerodynamics too. 
		You'll notice that some biplanes have better power/weight than high Br props. 
		It is true, but because biplanes have worse propellers and more draggy airframes they in fact climb and accelerate worse.
		
	<h1>What you should NOT do!</h1>
		<ul>
			<li>You should not use any of these graphs as 100% certain truth about aircraft performance in War Thunder. For sure there are some mistakes in this website, despite the fact if was validated for ~40 planes.</li>
			<li>You should not use any of these graphs for bug reports, because this website is not a valid source. 
				If you do, then your bug report will be rejected. Moreover Gajin bothered with such incorrect bug reports could take steps to restrict datamining,
				which is a foundation of projects like this. </li>
		</ul>


			<!-- However you can use these graphs to detect potential historical inaccuracies. 
			Then you must collect the same data yourself from a test flight in game. 
			If data collected in game is correct historically then this website must've been incorrect, so please report such problems on our Discord server.
			But if data in game is historically incorrect only then with such data and proper historical sources a bug report can be made -->
	  





		<!-- You're griding La-5, 7, 9 tree and want to choose ones to fly in and ones to skip. Despite similar looks they do differ:<br />
		La 5 &lt (La5F, La-5FN) &lt&lt La-7 &lt La-9 in terms of aerodynamics. They also have different propeller efficiencies.
		La-5s compress at medium-high speed a lot while the others don't.
			<br /><br />
			<h3>Question:</h3>
			Which La- are best relative to their Br?
			<br /><br />
			<h3>Checking:</h3>
			Select All Soviet tree La-s. Give 35% fuel to La-5 and La-5F, 45% to La-5FN and La-7, and keep 30% for La-9. 
		These fuel settings are rougly 18-20minutes of fuel for all these planes. You can leave speed at 300kph IAS - a typical dogfighting speed/ upper range of climmb speeds. 
		You'll see that all the planes overlap pretty well - no huge differences.
			<br /><br />
			<h3>Conclusion:</h3>
		<ul>
		  <li>La-5 is a good choice. It has a very good power/weight for a 3.0 Br although also an ineffienent propeller.</li>
		  <li>La-5F is not worth the extra aerodynamics at 3.3 Br.</li> 
		  <li>La-5FN has P/W an advantage at lower altitudes and disadvantage above 5300m. Combined with aerodynamics advantage and 4-5% more efficient propeller it's worth it at 3.7br.</li>
		  <li>La-7 offers only 0.011 hp/kg advantage over La-5FN for a whole 1.0 br increase. However the aerodynamics and high speed maneuverability difference is large so it might be worth it. And it has 3-4% more efficent propeller than La-5FN
			Better aerodynamics and propeller make La-7 climb 1.5-2m/s faster than La-5FN despite very similar power/weight. That's the shortcoming of Power/weight graphs, I'll expand on next.</li>
		  <li>Finally La-9 is significantly better below 500m but that's it. It's a bit faster at all altitudes but it's definetly not worth the 6.0 Br.</li>
		</ul>
		Overall La-5FN is the  best pick performance wise, and La-7 is a clsoe second in my interpretation. -->
	</span>
	<div id='guide_footer'>
		<Bugcat/>
		<h2>End of the guide</h2>
	</div>
</div>

<style>
	#guide_whole {
		line-height: 1.8;
		width: 80%;
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
	#guide_title {
		font-size: 2rem;
	}
	#guide_footer{
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 5rem;
	}
	#use_example {
		text-align: left;
	}
	#prop_eff_graph {
		width: 100%;
	}
</style>
