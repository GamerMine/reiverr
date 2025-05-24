<script lang="ts">
	import classNames from 'classnames';
	import { type Snippet } from 'svelte';

	let {
		size = 'md',
		type = 'secondary',
		slim = false,
		disabled = false,

		href = undefined,
		target = '_self',

		children,

		onclick = (_) => {},
		onfocus = () => {},
		onmouseover = () => {},
		onmouseleave = () => {},
		onblur = () => {}
	}: {
		size?: 'md' | 'sm' | 'lg' | 'xs';
		type?: 'primary' | 'secondary' | 'tertiary';
		slim?: boolean;
		disabled?: boolean;

		href?: string;
		target?: string;

		children: Snippet;

		onclick?: (e: MouseEvent) => void;
		onfocus?: () => void;
		onmouseover?: () => void;
		onmouseleave?: () => void;
		onblur?: () => void;
	} = $props();

	let buttonStyle: string = $state('');
	$effect(() => {
		buttonStyle = classNames(
			'flex items-center gap-1 font-medium select-none cursor-pointer selectable transition-all shrink-0',
			{
				'bg-white text-zinc-900 font-extrabold backdrop-blur-lg rounded-xl': type === 'primary',
				'hover:bg-amber-400 focus-within:bg-amber-400 hover:border-amber-400 focus-within:border-amber-400':
					type === 'primary' && !disabled,
				'text-zinc-200 bg-zinc-600/20 backdrop-blur-lg rounded-xl': type === 'secondary',
				'focus-visible:bg-zinc-200 focus-visible:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-800':
					(type === 'secondary' || type === 'tertiary') && !disabled,
				'rounded-full': type === 'tertiary',

				'py-2 px-6 sm:py-3 sm:px-6': size === 'lg' && !slim,
				'py-2 px-6': size === 'md' && !slim,
				'py-1 px-4': size === 'sm' && !slim,
				'py-1 px-4 text-sm': size === 'xs' && !slim,

				'p-2 sm:p-3': size === 'lg' && slim,
				'p-2': size === 'md' && slim,
				'p-1': size === 'sm' && slim,
				'p-1 text-sm': size === 'xs' && slim,

				'opacity-50': disabled,
				'cursor-pointer': !disabled
			}
		);
	});

	const handleClick = (event: MouseEvent) => {
		if (href) {
			window.open(href, target)?.focus();
		} else {
			onclick(event);
		}
	};
</script>

<button
	class={buttonStyle}
	onclick={handleClick}
	{onfocus}
	{onmouseover}
	{onmouseleave}
	{onblur}
	{disabled}
>
	{@render children?.()}
</button>
