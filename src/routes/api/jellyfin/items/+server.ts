import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { components, paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';
import { getUserId } from '$lib/apis/jellyfin/server/jellyfin.server';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const includeItemTypes = url.searchParams.getAll(
		'includeItemTypes'
	) as components['schemas']['BaseItemKind'][];
	const fields = url.searchParams.getAll('fields') as components['schemas']['ItemFields'][];
	const baseUrl = await Settings.getJellyfinBaseUrl();

	if (baseUrl) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
			}
		})
			.GET('/Items', {
				params: {
					query: {
						userId: (await getUserId(cookies.get('access_token'))) || '',
						hasTmdbId: url.searchParams.get('hasTmdbId') === 'true' || undefined,
						recursive: true,
						includeItemTypes: includeItemTypes,
						fields: fields,
						parentId: url.searchParams.get('parentId') || undefined
					}
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
	} else {
		return new Response(null, {
			status: 404
		});
	}
};
