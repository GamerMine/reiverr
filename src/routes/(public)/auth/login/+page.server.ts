import { redirect } from '@sveltejs/kit';
import { OIDC_ENABLED, OIDC_ONLY, OIDC_LABEL } from '$app/env/private';
import { initiateLogin } from '#lib/server/auth/oidc.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
	cookies,
	url,
	locals: {
		user: { userId }
	}
}) => {
	const logout = url.searchParams.has('logout');
	let oidcError = false;

	if (!logout && OIDC_ENABLED && (OIDC_ONLY || url.searchParams.has('oidc'))) {
		let redirectUrl;
		try {
			redirectUrl = await initiateLogin(cookies, url.searchParams.has('silent'));
		} catch (error) {
			console.error(`Failed to initiate OIDC login:`, error);
			oidcError = true;
		}

		if (redirectUrl) throw redirect(307, redirectUrl, { external: true });
	}

	if (userId && !logout) {
		throw redirect(307, '/');
	}

	return {
		oidcEnabled: OIDC_ENABLED,
		oidcLabel: OIDC_LABEL,
		oidcError,
		oidcOnly: OIDC_ONLY
	};
};
