<script lang='ts'>
  import Home_Top_panel from '$lib/home_top_panel.svelte';
  
  import Guide from '$lib/guide.svelte';
  import Features from '$lib/features.svelte';
  import Entrance from '$lib/entrance.svelte'
</script>

<div class="page_body">
  <Home_Top_panel/> 
  <Entrance/>
  <Features/>
  <Guide/>
  
  <div id="footer">
    <span>Copyright © 2024 Alpakinator. All Rights Reserved.</span><br/>
    <span>Made with SvelteKit</span>
  </div>
</div>


<style>
  .page_body {
    display: flex; /* or grid */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-top: 0.5rem;
    max-width: 90rem;
    margin-left: auto;
    margin-right: auto;
    padding-left: 2rem;
    padding-right: 2rem;
    
  }

  #footer{
    opacity: 0.6;
    font-size: 65%;
  }

</style>