import {getRequestEvent, query} from "$app/server";
import {FilteringProfileSchema} from "$lib/entities/Types";
import {isJellyfinUserConnected} from "$lib/apis/jellyfin/server/jellyfin.server";
import type {JellyfinUser} from "$lib/apis/jellyfin/jellyfinApi";
import {FilteringProfilesEntity} from "$lib/entities/FilteringProfiles.server";

// TODO: Add more error message when success: false

export const deleteFilteringProfile = query(FilteringProfileSchema, async (profile) => {
    const { cookies } = getRequestEvent();
    const userReq = await isJellyfinUserConnected(cookies);
    if (userReq.status !== 200) {
        return { success: false };
    }
    const user: JellyfinUser = await userReq.json();

    if (!user.Id || !user.Policy || !user.Policy.IsAdministrator) {
        return { success: false };
    }

    await FilteringProfilesEntity.deleteFilteringProfile(profile.id);

    return { success: true };
});