import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const requestData = await request.json();

	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.POST('/Sessions/Playing/Progress', {
			body: {
				CanSeek: true,
				ItemId: requestData.ItemId,
				PlaySessionId: requestData.PlaySessionId,
				IsPaused: requestData.IsPaused,
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
