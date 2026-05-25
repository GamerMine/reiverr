import {getRequestEvent, command} from "$app/server";
import * as v from "valibot";
import {assertUserAuth} from "$lib/apis/utils.server";
import {GlobalSettingsEntity} from "$lib/entities/GlobalSettings.server";
import {FilteringProfilesEntity} from "$lib/entities/FilteringProfiles.server";
import {Radarr} from "$lib/server/radarr.server";

export const addMovieToRadarr = command(v.number(), async (tmdbId: number) => {
    const {cookies} = getRequestEvent();
    await assertUserAuth(cookies);

    const client = await Radarr.getClient();
    const radarrRootPath = (await GlobalSettingsEntity.getClient()).radarr.rootFolderPath;
    const profile = await FilteringProfilesEntity.getDefaultProfile();

    if (!client) return {success: false};
    if (!radarrRootPath) return {success: false};
    if (!profile) return {success: false};

    const {data: movie} = await client
        .POST('/api/v3/movie', {
            body: {
                qualityProfileId: 1,
                rootFolderPath: radarrRootPath,
                tmdbId: tmdbId,
                monitored: true,
            }
        });
    if (!movie || !movie.id) return {success: false};

    return {success: true};
});