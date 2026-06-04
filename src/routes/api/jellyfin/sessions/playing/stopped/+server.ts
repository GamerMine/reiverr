import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import { assertUserAuth } from '$lib/server/utils.server';

export const POST: RequestHandler = async ({ cookies, request }) => {
	await assertUserAuth(cookies);

	const requestData = await request.json();

	return createClient<paths>({
		baseUrl: (await GlobalSettingsEntity.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.POST('/Sessions/Playing/Stopped', {
			body: {
				ItemId: requestData.ItemId,
				PlaySessionId: requestData.PlaySessionId,
				PositionTicks: requestData.PositionTicks,
				MediaSourceId: requestData.MediaSourceId
			}
		})
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		});
};
