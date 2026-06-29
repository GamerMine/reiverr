import { type Cookies } from '@sveltejs/kit';
import Connectors from '@reiverr/connectors';

export async function assertUserAuth(cookies: Cookies) {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const auth = await conn.isUserConnected(cookies.get('access_token') || '');

	if (!auth) return { userId: undefined, username: undefined, isAdmin: false };
	return auth.response.ok
		? {
				userId: auth.data?.Id,
				username: auth.data?.Name,
				isAdmin: !!auth.data?.Policy?.IsAdministrator
			}
		: { userId: undefined, username: undefined, isAdmin: false };
}
