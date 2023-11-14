import { hasFlag } from './util/mod.ts';
import type { MellowServer } from './types.ts';
import { MellowWebhookPayloadType, MellowServerAuditLogActionType } from './enums.ts';
export async function sendToWebhooks(server: MellowServer, eventType: MellowWebhookPayloadType, data: any) {
	for (const webhook of server.webhooks)
		if (webhook.enabled && hasFlag(webhook.events, MellowServerAuditLogActionType.RobloxServerProfileSync))
			await fetch(webhook.target_url, {
				body: JSON.stringify({
					type: eventType,
					...data
				}),
				method: webhook.request_method,
				headers: webhook.request_headers
			});
}