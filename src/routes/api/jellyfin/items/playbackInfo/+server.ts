import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';
import { getUserId } from '$lib/apis/jellyfin/server/jellyfin.server';

export const POST: RequestHandler = async ({ url, cookies, request }) => {
	const requestBody = await request.json();

	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.POST('/Items/{itemId}/PlaybackInfo', {
			params: {
				path: {
					itemId: url.searchParams.get('itemId') || ''
				}
			},
			body: {
				UserId: (await getUserId(cookies.get('access_token'))) || '',
				MaxStreamingBitrate: +(url.searchParams.get('maxStreamingBitrate') || '0'),
				StartTimeTicks: +(url.searchParams.get('startTimeTicks') || '0'),
				DeviceProfile: requestBody.playbackProfile,
				AutoOpenLiveStream: true
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
