<script lang='ts'>
    import Home_Top_panel from '$lib/home_top_panel.svelte';
    import Guide from '$lib/guide.svelte';
    	import LogosSvelteKit from '~icons/logos/svelte-kit'

  </script>



<div class="page_body">
  <Home_Top_panel/>
  <Guide/>


  <div id="footer">
    <span>Copyright © 2025 Alpakinator. All Rights Reserved.</span>
    <span>Made with  &nbsp <LogosSvelteKit /></span> 
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
    /* max-width: 110rem; */
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