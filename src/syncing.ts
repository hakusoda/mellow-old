import { getFixedT } from 'i18next';

import { content } from './commands/response.ts';
import { sendToWebhooks } from './servers.ts';
import { MellowWebhookPayloadType } from './enums.ts';
import { upsertUserChannel, createChannelMessage } from './discord.ts';
import type { DiscordGuild, MellowServer, WebhookSyncedEventItem } from './types.ts';
export async function notifyMemberOfRemoval(userId: string, server: DiscordGuild, type: 0 | 1, reason: string | null) {
	const t = getFixedT(server.preferred_locale, 'common');
	const channel = await upsertUserChannel(userId);
	if (channel)
		await createChannelMessage(channel.id, content(`${t('direct_message.removal', [server.name])}${t(`direct_message.type.${type}`)}${reason ? t('direct_message.reason', [reason]) : ''}${t('direct_message.footer')}`))
			.catch(console.error);
}

export async function sendSyncedWebhookEvent(server: MellowServer, items: WebhookSyncedEventItem[]) {
	if (items.length)
		await sendToWebhooks(server, MellowWebhookPayloadType.ServerProfilesSynced, { items });
}