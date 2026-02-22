<script lang="ts">
	import { Select } from 'bits-ui';
	import CuidaCaretDownOutline from '~icons/cuida/caret-down-outline';

	let {
		value = $bindable(),
		onValueChange = undefined,
		options = [],
		placeholder = 'Select...',
		id = undefined,
		class: className = '',
		style = '',
		'aria-label': ariaLabel = '',
		disabled = false
	} = $props();

	let triggerElement = $state();

	// Handle both array of strings and array of objects
	const normalizedOptions = $derived(() => {
		return options.map((option) => {
			if (typeof option === 'string') {
				return { value: option, label: option };
			}
			return option;
		});
	});

	const selectedLabel = $derived.by(() => {
		const selected = normalizedOptions().find((opt) => opt.value === value);
		return selected?.label || placeholder;
	});
</script>

<Select.Root
	type="single"
	{value}
	onValueChange={(newValue) => {
		value = newValue ?? value;
		if (onValueChange) {
			onValueChange(newValue);
		}
	}}
	{disabled}
>
	<Select.Trigger {id} class="b-select-field {className}" {style} aria-label={ariaLabel}>
		{selectedLabel}
		<CuidaCaretDownOutline class="caret-svg" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="b-select-dropdown" align="start">
			<Select.Viewport>
				{#each normalizedOptions() as option}
					<Select.Item class="b-select-item" value={option.value} label={option.label}>
						{option.label}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
