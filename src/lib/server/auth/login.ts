import Connectors from '@unifarr/connectors';
import { guestUser } from './auth';

export async function checkSession(accessToken: string) {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const auth = await conn.isUserConnected(accessToken);

	if (!auth || !auth.response.ok) return guestUser();

	return {
		userId: auth.data?.Id as string,
		username: auth.data?.Name as string,
		isAdmin: !!auth.data?.Policy?.IsAdministrator
	};
}
