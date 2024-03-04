import JiraCloud from "add import path set up from ScriptRunner Connect"
const orgId = "add org ID here"
const issueKey = "TEST-1"
let usersNotLoggedIn90Days = []
const token = "add org api token here"

export default async function (event: any, context: Context): Promise<void> {
	console.log('Script triggered', event, context);

	let getWorkspaces = await fetch(`https://api.atlassian.com/admin/v2/orgs/${orgId}/workspaces`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ "limit": 50 })
	})
	let { data } = await getWorkspaces.json();
	const refinedWorkspaceData = data.map(workspace => ({
		id: workspace.id,
		url: workspace.attributes.hostUrl,
		product: workspace.attributes.typeKey
	})).filter(workspace => workspace.product != "jira-admin")


	const users = await JiraCloud.User.getUsers()
	const activeUsers = users.filter(user => user.accountType == "atlassian" && user.active == true)

	await Promise.all(
		activeUsers.map(async (user) => {
			let response = await fetch(`https://api.atlassian.com/admin/v1/orgs/${orgId}/directory/users/${user.accountId}/last-active-dates`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			})
			const { data } = await response.json();
			const accessInfo = data.product_access.map(product => ({
				product: product.key,
				siteId: product.id,
				last_active: new Date(product.last_active)
			}))
			var today = new Date();
			var ninteyDaysAgo = new Date(new Date().setDate(today.getDate() - 90));
			let accessPastNinteyDays = accessInfo.filter(access => access.last_active < ninteyDaysAgo)
			if (accessPastNinteyDays.length > 0) {
				usersNotLoggedIn90Days.push({
					userInfo: {
						displayName: user.displayName,
						active: user.active,
						accountId: user.accountId,
						emailAddress: user.emailAddress ? user.emailAddress : null,
						added_to_org: data.added_to_org ? data.added_to_org : "only available in new user management experience"
					},
					product_access: accessPastNinteyDays
				})
			}
		})
	)

	const csvRows = [];
	const headers = ["displayName", "active", "accountId", "emailAddress", "added_to_org"]
	refinedWorkspaceData.map(wsp => headers.push(`${wsp.product} (${wsp.url})`));
	csvRows.push(headers.join(","))
	for (const row of usersNotLoggedIn90Days) {
		const values = headers.map((header) => {
			switch (header) {
				case ("displayName"): return row.userInfo.displayName;
				case ("active"): return row.userInfo.active;
				case ("accountId"): return row.userInfo.accountId;
				case ("emailAddress"): return row.userInfo.emailAddress ? row.userInfo.emailAddress : "";
				case ("added_to_org"): return new Date(row.userInfo.added_to_org).toLocaleDateString() ? new Date(row.userInfo.added_to_org).toLocaleDateString() : "";
				default:
					const productKey = header.split("(")[0]
					const url = header.split("(")[1].split(")")[0]
					let workspaceId = refinedWorkspaceData.find(wsp => wsp.product === productKey.trim() && wsp.url === url.trim()).id
					const access = row.product_access.filter(access => access.siteId === workspaceId)
					if (access) {
						const lastActive = access.map(ac => new Date(ac.last_active).toLocaleDateString())
						return lastActive
					} else return ""
			}
		});
		csvRows.push(values.join(","))
	}
	const finalData = csvRows.join("\n");
	const attachCSV = await JiraCloud.Issue.Attachment.addAttachments({
		issueIdOrKey: issueKey,
		body: [{
			fileName: `userList.csv`,
			content: finalData
		}]
	});
	if (attachCSV.filter(attachment => attachment.created)) {
		console.log(`The CSV file has been attached successfully on ${issueKey}.`)
	}
	else console.log(`An error has occurred when trying to attach the CSV file to ${issueKey}`)
}