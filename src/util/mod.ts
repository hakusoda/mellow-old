import { InteractionResponse, InteractionCallbackData } from 'discordeno';
export function isInteractionResponse(response: InteractionResponse | InteractionCallbackData): response is InteractionResponse {
	return Reflect.has(response, 'type');
}