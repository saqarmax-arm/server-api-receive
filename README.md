API Receive Server
---

## Signature algorithm

`RSA-SHA256`

## Register
`POST`

/api/v1/users

Request

```
{
    "email": String,
    "password": String
}
```

Response

```
{
    "_id": String,
    "email": String
}
```

## Login
`POST`

/api/v1/login

Request

```
{
    "email": String,
    "password": String
}
```

Response

```
{
    "_id": String,
    "email": String
}
```


## Logout
`POST`

/api/v1/logout

```
{
    
}
```

## Create keys
`POST`

/api/v1/keys

Request

```
    {
        "address": String
    }
```

Response

```
{
  "_id": String,
  "user_id": String,
  "address": String,
  "public_key": String,
  "private_key": String,
  "created_at": DateISO8601
}
```

## Get keys
`GET`

/api/v1/keys

Response
```
[
  {
    "_id": String,
    "user_id": String,
    "address": String,
    "public_key": String,
    "private_key": String,
    "created_at": DateISO8601
  },
  ...
]
```

## Create Transaction
`POST`
/api/v1/transactions

Request

```
var jsonString = JSON.stringify({
                    "public_key": String,
                    "datetime": DateISO8601,
                    "amount": Number
                 });
var Base64String = base64_encode(jsonString);
```

```
    
 {
    "payload": Base64String,
    "header": {
        "signature": String // signature of "Base64String" String
    }
  }
```

Response 
```
{
  "_id": String,
  "address": String,
  "status": String, ('finished', 'confirmed', 'wait_confirm', 'pending')
  "amount": Number,
  "tx_hash_receive": String,
  "tx_receive_created_at": DateISO8601,
  "tx_hash_transfer": String,
  "tx_transfer_created_at": DateISO8601,
  "created_at": DateISO8601
}
```

## Get Transaction Info
`GET`

/api/v1/transactions/:trxId

```
{
  "_id": String,
  "address": String,
  "status": String, ('finished', 'confirmed', 'wait_confirm', 'pending')
  "amount": Number,
  "tx_hash_receive": String,
  "tx_receive_created_at": DateISO8601,
  "tx_hash_transfer": String,
  "tx_transfer_created_at": DateISO8601,
  "created_at": DateISO8601
}
```

## Error Response
```
{
  "code": 422,
  "errors": [
    {
      "msg": "Account with that email address already exists.",
      "param": "email"
    },
    ...
  ]
}
```





