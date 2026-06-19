<script lang="ts">
	import { onMount } from 'svelte';
	import { type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
	import classNames from 'classnames';
	import { jellyfinGetUserImage } from '$lib/remote/jellyfin.remote';

	let {
		user = undefined,
		size = 10,
		textSize = 'text-xl',

		klass = ''
	}: {
		user?: JellyfinUser;
		size?: number;
		textSize?: 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl';
		klass?: string;
	} = $props();

	let userImgDiv: HTMLDivElement | undefined = $state();
	let sizePx = `${size * 0.25}rem`;

	async function getProfilePicture() {
		if (userImgDiv) {
			userImgDiv.innerHTML = '';
			if (user && user.Id && user.Name) {
				let ppData = await jellyfinGetUserImage(user.Id);
				if (ppData.data) {
					let ppBlob = new Blob(
						[Uint8Array.from(atob(ppData.data), (c) => c.charCodeAt(0))],
						{
							type: 'image/png'
						}
					);
					let img = document.createElement('img');

					img.src = URL.createObjectURL(ppBlob);
					img.alt = 'pp';
					img.className = `rounded-md object-cover`;
					img.style.width = sizePx;
					img.style.height = sizePx;
					img.style.minWidth = sizePx;
					img.style.minHeight = sizePx;

					userImgDiv.appendChild(img);
				} else {
					let h1 = document.createElement('h1');

					h1.innerText = user.Name.charAt(0);
					h1.className = `uppercase ${textSize}`;

					userImgDiv.appendChild(h1);
				}
			} else {
				let h1 = document.createElement('h1');

				h1.innerText = '?';
				h1.className = `uppercase ${textSize}`;

				userImgDiv.appendChild(h1);
			}
		}
	}

	onMount(() => {
		getProfilePicture();
	});
</script>

<div
	bind:this={userImgDiv}
	class={classNames(`flex items-center justify-center bg-stone-800/90 rounded-md`, klass)}
	style={`min-width: ${sizePx}; width: ${sizePx}; min-height: ${sizePx}; height: ${sizePx};`}
>
	<h1 class="uppercase text-2xl">?</h1>
</div>
