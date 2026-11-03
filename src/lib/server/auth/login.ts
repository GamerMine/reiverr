import Connectors from '@reiverr/connectors';

export async function checkSession(accessToken: string) {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const auth = await conn.isUserConnected(accessToken);

	if (!auth || !auth.response.ok) return { isConnected: false, isAdmin: false };

	return {
		userId: auth.data?.Id,
		username: auth.data?.Name,
		isAdmin: !!auth.data?.Policy?.IsAdministrator
	};
}