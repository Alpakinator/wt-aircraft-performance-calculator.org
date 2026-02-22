<script lang="ts">
    import { Tooltip } from 'bits-ui';
    import { flyAndScale } from '$lib/transitions';
    let { children } = $props();
</script>

<Tooltip.Root openDelay={400} closeOnEscape={false} closeOnPointerDown={false}>
    <Tooltip.Trigger class="tooltip_button">?</Tooltip.Trigger>
    <Tooltip.Content
        class="tooltip"
        transition={flyAndScale}
        transitionConfig={{ y: 0, duration: 100 }}
        side="right"
        align="start"
        sideOffset={-1}
    >
    {@render children()}
    </Tooltip.Content>
</Tooltip.Root>
