import {
	isJellyfinUserConnected
} from '$lib/apis/jellyfin/server/jellyfin.server';
import { fail } from '@sveltejs/kit';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import type {FilteringProfile} from '$lib/entities/Types';
import type { PageServerLoad } from './$types';
import {FilteringProfilesEntity} from "$lib/entities/FilteringProfiles.server";
import {QUALITY_DEFS} from "$lib/constants";

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (userReq.status !== 200) {
		return { isAdmin: false };
	}

	const user: JellyfinUser = await userReq.json();
	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin: user.Policy?.IsAdministrator || false,
		filteringProfiles
	};
};

export const actions = {
	editFilteringProfile: async ({ request, cookies }) => {
		const formData = await request.formData();
		const userReq = await isJellyfinUserConnected(cookies);
		if (userReq.status !== 200) {
			return fail(userReq.status);
		}
		const user: JellyfinUser = await userReq.json();

		if (!user.Id) {
			return fail(401);
		}

		if (!user.Policy || !user.Policy.IsAdministrator) {
			return fail(403);
		}

		const profileId = formData.get('profileId') as string;
		const profileName = formData.get('profileName') as string;
		const qualities = formData.getAll('qualities') as string[];
		const isDefault = (formData.get('defaultProfile') as string) === 'on';

		if (!profileId || Number.isNaN(profileId)) {
			return fail(400);
		}

		for (const quality of qualities) {
			if (!QUALITY_DEFS.includes(quality)) {
				return fail(400);
			}
		}

		const profile: FilteringProfile = {
			id: Number(profileId),
			name: profileName,
			qualities,
			isDefault,
		}

		await FilteringProfilesEntity.editFilteringProfile(profile);

		return {
			success: true,
		}
	}
};
