import { editOriginalResponse } from '../discord.ts';
import type { CustomCommand, DiscordInteraction, CustomCommandAction } from '../types.ts';
import { CustomCommandActionType, CustomCommandIfStatementType, CustomCommandActionResultType } from '../enums.ts';
export async function processCustomCommand(interaction: DiscordInteraction, command: CustomCommand) {
	const items = command.actions.filter(action => !action.parent_id).sort(sortPosition);
	console.log(items);

	const variables: Record<string, any> = {};
	const finished = await processActions(items, command, interaction, variables);
	if (finished)
		return console.log('custom command finished!');

	return editOriginalResponse(interaction.token, {
		content: 'no response...'
	});
}

async function processActions(actions: CustomCommandAction[], command: CustomCommand, interaction: DiscordInteraction, variables: Record<string, any>, parentData?: any) {
	for (const action of actions) {
		const [resultType, data] = await processAction(action, command, interaction, variables, parentData);
		if (resultType === CustomCommandActionResultType.Data) {
			if (await processActions(command.actions.filter(a => a.parent_id === action.id).sort(sortPosition), command, interaction, variables, data))
				return true;
		} else if (resultType === CustomCommandActionResultType.Finish)
			return true;
	}
	return false;
}

async function processAction({ id, type, data }: CustomCommandAction, command: CustomCommand, interaction: DiscordInteraction, variables: Record<string, any>, parentData?: any): Promise<[CustomCommandActionResultType, any?]> {
	console.log(id, type, data, parentData);
	if (type === CustomCommandActionType.GetRandomIntegerBetween) {
		const [min, max] = data;
		return [CustomCommandActionResultType.Data, Math.floor(Math.random() * (max - min + 1) + min)];
	} else if (type === CustomCommandActionType.IfStatement) {
		const [statementType, value] = data;
		if (statementType === CustomCommandIfStatementType.Equals) {
			const itype = parentData === value ? 1 : 2;
			if (await processActions(command.actions.filter(a => a.parent_id === id && a.parent_type === itype).sort(sortPosition), command, interaction, variables, null))
				return [CustomCommandActionResultType.Finish];
		}
		return [CustomCommandActionResultType.None];
	} else if (type === CustomCommandActionType.EndWithMessage) {
		await editOriginalResponse(interaction.token, data);
		return [CustomCommandActionResultType.Finish];
	}
	throw new Error(`can not handle ${type}`);
}

const sortPosition = (a: CustomCommandAction, b: CustomCommandAction) => a.position - b.position;