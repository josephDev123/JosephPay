# API Standards

Response format

{
"success": true,
"message": "...",
"data": {}
}

Error format

{
"success": false,
"message": "...",
"code": "...",
"errors": []
}

Use plural resources:

/users
/wallets
/transfers
/transactions

Version all APIs:

/api/v1
