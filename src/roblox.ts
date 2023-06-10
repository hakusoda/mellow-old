export function getRobloxUserRoles(userId: string | number) {
	return fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
		.then(response => response.json())
		.then(data => (data as RobloxUserRolesResponse).data);
}

export interface RobloxUserRolesResponse {
	data: {
		role: {
			id: number
			name: string
			rank: number
		}
		group: {
			id: number
			name: string
			memberCount: number
			hasVerifiedBadge: boolean
		}
	}[]
}