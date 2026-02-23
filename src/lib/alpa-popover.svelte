<script lang="ts">
	import { Popover } from 'bits-ui';
	import { slide } from 'svelte/transition';
	let { children } = $props();

	let isOpen = $state(false);
	let hoverTimeout: number | undefined;

	function handleMouseEnter() {
		clearTimeout(hoverTimeout);
		hoverTimeout = window.setTimeout(() => {
			isOpen = true;
		}, 0); // Same delay as your original tooltip
	}

	function handleMouseLeave() {
		clearTimeout(hoverTimeout);
		hoverTimeout = window.setTimeout(() => {
			isOpen = false;
		}, 0); // Small delay to prevent flickering
	}
</script>

<div class="popover_host">
	<Popover.Root bind:open={isOpen}>
		<Popover.Trigger
			class="popover_button"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			?
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				class="popover"
				side="right"
				align="start"
				sideOffset={0}
				forceMount
				onmouseenter={() => clearTimeout(hoverTimeout)}
				onmouseleave={handleMouseLeave}
			>
				{#snippet child({ wrapperProps, props, open })}
					{#if open}
						<div {...wrapperProps}>
							<div {...props} transition:slide={{ duration: 100 }}>
								{@render children()}
							</div>
						</div>
					{/if}
				{/snippet}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>

<style>
	.popover_host {
		margin-left: auto;
		display: flex;
		align-items: stretch;
		align-self: stretch;
	}
</style>
