import type { PageServerLoad } from './$types';
import { OIDC_ENABLED } from '$app/env/private';
import { redirect } from '@sveltejs/kit';
import { completeLogin } from '#lib/server/auth/oidc.ts';

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (!OIDC_ENABLED) {
		throw redirect(307, '/');
	}

	try {
		return {
			user: await completeLogin(url, cookies)
		};
	} catch (error) {
		console.error(`Failed to initiate OIDC login:`, error);
	}

	return {
		oidcError: url.searchParams.get('error'),
		oidcErrorDescription: url.searchParams.get('error_description')
	};
};
