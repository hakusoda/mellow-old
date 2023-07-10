import { status } from './mod.ts';
import { sendLogs } from '../logging.ts';
import { MELLOW_KEY } from '../util/constants.ts';
export default async (request: Request) => {
	if (request.headers.get('x-api-key') !== MELLOW_KEY)
		return new Response('missing key', { status: 403 });

	const type = parseInt(new URL(request.url).searchParams.get('type')!);
	const body = await request.json();
	await sendLogs([[type, body.record]], body.record.server_id);

	return status(200);
}