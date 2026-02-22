<script lang='ts'>
   let imageUrl = "images/work_in_progress.gif";
    function changeImage() {
          imageUrl = "images/resting_cat.png";
      }
      function  changeImageback(){
        imageUrl = imageUrl = "images/work_in_progress.gif";
      }
  </script>

<div id="bug-cat">
<span>The Bug-Cat is improving the guide:</span>
    <br>
    <img src= {imageUrl} id='bugcat_iself' alt='working_in_progress_gif'/>
    <br>
    <button id='break_button' on:click={changeImage}>Click to give the Bug-Cat a break 😊</button>
    <button id='work_button' on:click={changeImageback}>GET BACK TO WORK 😭</button>
</div>
<style>
    #bugcat_iself{
        width: 14rem;
    }
    #bug-cat{
        
        width: 18rem;
        border: 0.2rem solid rgb(27, 31, 36);
    }
    #break_button, #work_button{
        background-color: #363642;
        color: inherit;
        font-weight: 300;
        border: 0;
    }
</style>