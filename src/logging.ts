import { getFixedT } from 'i18next';

import { hasFlag } from './util/mod.ts';
import { supabase } from './database.ts';
import { createChannelMessage } from './discord.ts';
import { MellowServerLogType, MellowServerAuditLogType } from './enums.ts';
import type { DiscordRole, DiscordMember, PartialRobloxUser } from './types.ts';
export async function sendLogs(logs: Log[], serverId: string) {
	const embeds: any[] = [];

	const server = await supabase.from('mellow_servers').select('logging_types, logging_channel_id').eq('id', serverId).single();
	if (server.error) {
		console.error(server.error);
		return;
	}

	if (server.data.logging_channel_id) {
		const t = getFixedT('en-US', 'common');
		for (const [type, data] of logs) {
			if (hasFlag(server.data.logging_types, type))
				if (type === MellowServerLogType.AuditLog) {
					const author = await supabase.from('users').select('name, username, avatar_url').eq('id', data.author_id).single();
					if (author.error) {
						console.error(author.error);
						return;
					}

					const authorName = author.data.name ? author.data.name : `@${author.data.username}`;
					const fields: any[] = [];
					if (data.type === MellowServerAuditLogType.UpdateRobloxLink) {
						if (data.data.name[1])
							fields.push({
								name: t('server_audit_log.type.4.name'),
								value: `\`\`\`diff\n- ${data.data.name[0]}\n+ ${data.data.name[1]}\`\`\``,
								inline: true
							});
						if (data.data.type[1])
							fields.push({
								name: t('server_audit_log.type.4.type'),
								value: `\`\`\`diff\n- ${data.data.type[0]}\n+ ${data.data.type[1]}\`\`\``,
								inline: true
							});
						if (data.data.target_ids)
							fields.push({
								name: t('server_audit_log.type.4.target_ids'),
								value: `${data.data.target_ids} Targets`
							});
						if (data.data.requirements)
							fields.push({
								name: t('server_audit_log.type.4.requirements'),
								value: `${data.data.requirements} Requirements`,
								inline: true
							});
						if (data.data.requirements_type[1])
							fields.push({
								name: t('server_audit_log.type.4.requirements_type'),
								value: `\`\`\`diff\n- ${t(`requirements_type.${data.data.requirements_type[0]}`)}\n+ ${t(`requirements_type.${data.data.requirements_type[1]}`)}\`\`\``
							});
					}

					embeds.push({
						title: `${authorName} ${t(`server_audit_log.type.${data.type}`, [data])}`,
						fields,
						author: {
							url: `https://www.voxelified.com/user/${author.data.username}`,
							name: authorName,
							icon_url: author.data.avatar_url
						},
						footer: {
							text: t(`logging:type.${type}`)
						},
						timestamp: data.created_at,
						description: t(`logging:type.${type}.content`, [data])
					});
				} else if (type === MellowServerLogType.ServerProfileSync) {
					const rolesChanged = data.addedRoles.length || data.removedRoles.length;
					const [oldNick, newNick] = data.nickname;

					const nickChanged = oldNick !== newNick;
					embeds.push({
						title: t(`logging:type.${type}.title`, [data.member.user.global_name]),
						fields: [
							...rolesChanged ? [{
								name: t('command:verify.complete.embed.roles'),
								value: `\`\`\`diff\n${[...data.removedRoles.map(r => '- ' + r.name), ...data.addedRoles.map(r => '+ ' + r.name)].join('\n')}\`\`\``,
								inline: true
							}] : [],
							...nickChanged ? [{
								name: t('command:verify.complete.embed.nickname'),
								value: `\`\`\`diff\n${newNick ? `${oldNick ? `- ${oldNick}\n` : ''}+ ${newNick}` : `- ${oldNick}`}\`\`\``,
								inline: true
							}] : []
						],
						author: {
							url: `https://discord.com/users/${data.member.user.id}`,
							name: data.member.user.global_name,
							icon_url: `https://cdn.discordapp.com/avatars/${data.member.user.id}/${data.member.avatar ?? data.member.user.avatar}.webp?size=48`
						},
						footer: {
							text: t(`logging:type.${type}`)
						},
						timestamp: new Date().toISOString(),
						description: t(`logging:type.${type}.content`, [data])
					});
				}
		}

		if (embeds.length)
			await createChannelMessage(server.data.logging_channel_id, {
				embeds
			});
	}
}

type AuditLogLog = [MellowServerLogType.AuditLog, {
	id: string
	data: any
	type: MellowServerAuditLogType
	author_id: string
	server_id: string
	created_at: string
	target_link_id: string
}]
type ServerProfileSyncLog = [MellowServerLogType.ServerProfileSync, {
	member: DiscordMember
	roblox: PartialRobloxUser
	nickname: [string | null, string | null]
	addedRoles: DiscordRole[]
	removedRoles: DiscordRole[]
}]

type Log = AuditLogLog | ServerProfileSyncLog