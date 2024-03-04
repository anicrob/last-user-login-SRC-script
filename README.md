# Get Users Who Haven't Logged In the Past 90 days

Using Adaptavist's ScriptRunner Connect app, you can use this script to get the users who haven't loggged in the past 90 days on all of your sites within your org, having that info exported to a CSV file and attached to a Jira issue of your choice.

## Setup Instructions

1. Add one of your Jira sites as a Connector in ScriptRunner Connect

2. Add the following values to the script:

- the path created for the connector

When you create a connector, it asks you what you want to name the path, so you can import this connection (basically the site's REST API library without having to authenticate). Once this is set up, add the path here:

```
import JiraCloud from "add import path set up from ScriptRunner Connect"
```

- Also, add the org ID here: [finding the Org Id](https://confluence.atlassian.com/jirakb/what-it-is-the-organization-id-and-where-to-find-it-1207189876.html)
```
const orgId = "add org ID here"
```

- also add the org api token (this is generated at the same time as the org id)

```
const token = "add org api token here"
```

- Add the issue key you want the script to attach the CSV file to:
```
const issueKey = "TEST-1"
```

