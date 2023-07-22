import { InteractionResponse, InteractionCallbackData } from 'discordeno';
export function isInteractionResponse(response: InteractionResponse | InteractionCallbackData): response is InteractionResponse {
	return Reflect.has(response, 'type');
}

export function splitArray<T>(array: T[], chunkSize: number) {
	return array.reduce<T[][]>((resultArray, item, index) => { 
		const chunkIndex = Math.floor(index / chunkSize);
		if(!resultArray[chunkIndex])
		 	resultArray[chunkIndex] = [];
			
		(resultArray[chunkIndex] ??= []).push(item);
		return resultArray
	}, []);
}

export const uuidRegex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/;

export const isUUID = (uuid: string) => uuidRegex.test(uuid);
export const hasFlag = (bits: number, bit: number) => (bits & bit) === bit;