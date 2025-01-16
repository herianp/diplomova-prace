# Club-system
## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Struktura Firebase

### users/{userId}
```json
{
"name": "John Doe",
"createdAt":"2024-11-28T09:47:45.808Z",
"uid":"YRIgVySVmggfNfQLyYN0KLTIyxv2",
"email": "johndoe@example.com",
"teams": [
{
"teamId": "team123",
"role": "poweruser"  // or "member"
}
]
}
```

### teams/{teamId}
```json
{
"name": "Team Alpha",
"creator": "user123",  // Reference to userId
"powerusers": ["user123", "user456"],  // Array of userIds
"members": ["user789", "user456"],     // Array of userIds
"invitationCode": "INV123",
"surveys": [
"survey456",  // List of survey IDs
"survey789"
]
}
```

### surveys/{surveyId}
```json
{
"teamId":"uEZO8nf4Y1bi85MAPtlt ",
"createdDate": "11732778231087",
"date": "1111-11-11",
"dateTime": November 11, 1111 at 11:11:00 AM UTC+0:57.733333333333334,
"description":"Strelba",
"time":"20:30",
"title":"Trenink",
"voes": [
{
user: {"uid": "5FHbk5Iq4NWKj66CGVLWglC6RX52"},
vote: false
}
]
}
```
