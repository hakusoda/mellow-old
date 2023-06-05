import { validatePermissions } from 'permission-plugin';

import type { Command } from '../commands/mod.ts';
import type { DiscordInteraction } from '../types.ts';
export async function hasPermission(command: Command, payload: DiscordInteraction) {
	if (!command.permissionLevels)
		return true;
	if (typeof command.permissionLevels === 'function')
		return await command.permissionLevels(payload, command);

	for (const permlevel of command.permissionLevels)
		if (await PermissionLevelHandlers[permlevel](payload, command))
			return true;
	return false;
}

export const PermissionLevelHandlers: Record<
	string,
	(payload: DiscordInteraction, command: Command) => boolean | Promise<boolean>
> = {
	MEMBER: () => true,
	MODERATOR: (payload) => Boolean(payload.member?.permissions) &&
		validatePermissions(payload.member!.permissions! as any, ["MANAGE_GUILD"]),
	ADMIN: (payload) =>
		Boolean(payload.member?.permissions) &&
		validatePermissions(payload.member!.permissions! as any, ["ADMINISTRATOR"]),
	DEVELOPERS: (payload) => ['330217691203895297'].includes((payload.member?.user?.id || payload.user?.id!).toString()),
}

export enum PermissionLevels {
	MEMBER,
	MODERATOR,
	ADMIN,
	SERVER_OWNER,
	DEVELOPERS
}