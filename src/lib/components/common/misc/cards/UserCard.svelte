<script lang="ts">
	import { jellyfinGetUserImage, type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';

	let {
		user,
		clickable = true,
		klass = '',
		onclick = (_) => {}
	}: {
		user?: JellyfinUser;
		clickable?: boolean;
		klass?: string;
		onclick?: (e: MouseEvent) => void;
	} = $props();
	let contentDiv: HTMLDivElement | undefined = $state();

	async function getProfilePicture() {
		if (contentDiv) {
			contentDiv.innerHTML = '';
			if (user && user.Id && user.Name) {
				let ppBlob = await jellyfinGetUserImage(user.Id);
				if (ppBlob.size !== 0) {
					let img = document.createElement('img');

					img.src = URL.createObjectURL(ppBlob);
					img.alt = 'pp';
					img.className = 'rounded-md w-26 h-26 object-cover';

					contentDiv.appendChild(img);
				} else {
					let h1 = document.createElement('h1');

					h1.innerText = user.Name.charAt(0);
					h1.className = 'uppercase text-7xl text-stone-700';

					contentDiv.appendChild(h1);
				}
			} else {
				let h1 = document.createElement('h1');

				h1.innerText = '?';
				h1.className = 'uppercase text-7xl text-stone-700';

				contentDiv.appendChild(h1);
			}
		}
	}

	$effect(() => {
		getProfilePicture();
	});
</script>

<button
	class="space-y-3 w-30 p-2 rounded-md transition duration-300 ease-in-out {clickable
		? 'hover:bg-stone-900/60 cursor-pointer'
		: 'cursor-default'} {klass}"
	{onclick}
>
	<div class="rounded-md w-26 h-26 bg-stone-900/60 flex items-center justify-center">
		<div bind:this={contentDiv}></div>
	</div>
	<div class="flex justify-center-safe truncate text-stone-300">{user?.Name || ''}</div>
</button>
