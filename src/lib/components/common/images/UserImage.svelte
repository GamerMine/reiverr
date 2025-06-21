<script lang="ts">
	import { onMount } from 'svelte';
	import { jellyfinGetUserImage, type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
	import classNames from 'classnames';

	let {
		user = undefined,
		size = 10,

		klass = ''
	}: { user?: JellyfinUser; size?: number; klass?: string } = $props();

	let userImgDiv: HTMLDivElement | undefined = $state();

	async function getProfilePicture() {
		if (userImgDiv) {
			userImgDiv.innerHTML = '';
			if (user && user.Id && user.Name) {
				let ppBlob = await jellyfinGetUserImage(user.Id);
				if (ppBlob.size !== 0) {
					let img = document.createElement('img');

					img.src = URL.createObjectURL(ppBlob);
					img.alt = 'pp';
					img.className = `rounded-md min-w-${size} w-${size} min-h-${size} h-${size} object-cover`;

					userImgDiv.appendChild(img);
				} else {
					let h1 = document.createElement('h1');

					h1.innerText = user.Name.charAt(0);
					h1.className = 'uppercase text-xl';

					userImgDiv.appendChild(h1);
				}
			} else {
				let h1 = document.createElement('h1');

				h1.innerText = '?';
				h1.className = 'uppercase text-2xl';

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
	class={classNames(
		`flex items-center justify-center min-w-${size} w-${size} min-h-${size} h-${size} bg-stone-900/90 rounded-md`,
		klass
	)}
>
	<h1 class="uppercase text-2xl">?</h1>
</div>
