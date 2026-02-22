<script lang='ts'>
  import Home_Top_panel from '$lib/home_top_panel.svelte';
  
  import Guide from '$lib/guide.svelte';
  import Features from '$lib/features.svelte';
  import Entrance from '$lib/entrance.svelte'
	import LogosSvelteKit from '~icons/logos/svelte-kit'
</script>

<svelte:head>
  <meta property="og:url" content="https://wtapc.org/">
  <meta property="og:title" content="War Thunder Aircraft Performance Calcuator">
  <meta property="og:description" content="Graphs of engine power and power/weight of all piston aircraft in War Thunder, at all altitudes.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://wtapc.org/images/WTAPC_logo_1280.png">
  

  <meta name="twitter:card" content="summary_large_image">
  <meta property="twitter:domain" content="wtapc.org">
  <meta property="twitter:url" content="https://wtapc.org/">
  <meta name="twitter:title" content="War Thunder Aircraft Performance Calcuator">
  <meta name="twitter:description" content="Graphs of engine power and power/weight of all piston aircraft in War Thunder, at all altitudes.">
  <meta name="twitter:image" content="https://wtapc.org/images/WTAPC_logo_1280.png">
</svelte:head>
<div class="page_body">
  <Home_Top_panel/> 
  <Entrance/>
  <Features/>

  <div id="footer">
    <span>Copyright © 2025 Alpakinator. All Rights Reserved.</span>
    <span>Made with &nbsp <LogosSvelteKit /></span> 
  </div>
</div>


<style>
  span{
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;

  }
  .page_body {
    display: flex; /* or grid */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-top: 0.5rem;
    margin-left: auto;
    margin-right: auto;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    
  }

  #footer{
    opacity: 0.6;
    font-size: 65%;
  }

</style>