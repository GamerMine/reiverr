import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { components, paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import { getUserId } from '$lib/apis/jellyfin/server/jellyfin.server';
import { assertParam, assertUserAuth } from '$lib/server/utils.server';

export const GET: RequestHandler = async ({ cookies, url }) => {
	await assertUserAuth(cookies);

	const includeItemTypes = assertParam(
		url,
		'includeItemTypes'
	) as unknown as components['schemas']['BaseItemKind'][];
	const fields = assertParam(url, 'fields') as unknown as components['schemas']['ItemFields'][];
	const baseUrl = await GlobalSettingsEntity.getJellyfinBaseUrl();

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
			})
			.catch(() => {
				return new Response(JSON.stringify({}), {
					status: 504
				});
			});
	} else {
		return new Response(null, {
			status: 404
		});
	}
};
