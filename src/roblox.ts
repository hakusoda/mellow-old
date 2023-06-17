export function getRobloxUsers(userIds: (string | number)[]) {
	return fetch(`https://users.roblox.com/v1/users`, {
		body: JSON.stringify({
			userIds,
			excludeBannedUsers: false
		}),
		method: 'POST'
	})
		.then(response => response.json())
		.then(data => (data as RobloxUsersResponse).data);
}

export function getRobloxUserRoles(userId: string | number) {
	return fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
		.then(response => response.json())
		.then(data => (data as RobloxUserRolesResponse).data);
}

export interface RobloxUsersResponse {
	data: {
		id: number
		name: string
		displayName: string
		hasVerifiedBadge: boolean
	}[]
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