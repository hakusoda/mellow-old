import { InteractionResponse, InteractionCallbackData } from 'discordeno';
export function isInteractionResponse(response: InteractionResponse | InteractionCallbackData): response is InteractionResponse {
	return Reflect.has(response, 'type');
}

export const uuidRegex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/;

export const isUUID = (uuid: string) => uuidRegex.test(uuid);
export const hasFlag = (bits: number, bit: number) => (bits & bit) === bit;