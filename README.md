# oauth24d

> Note: I __did not__ invent this approach.

A common pattern and RESTful interface for securing authentication on devices with awful input mechanisms. :keyboard: :key: :fire:

## API

> Note: The following information is available in swagger format as well ([raw](./swagger.yaml) - [redoc](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/oauth24d/master/swagger.yaml)).

> This RESTful API speaks soley `application/json`, and it is expected that all endpoints respond in this format.

The expectation is that any device that implements support for communicating with services that implement the following
API need only be given the following information:

+ The absolute (https) path to the [/new](#new) endpoint
+ The absolute (https) path to the [/poll](#poll) endpoint

### /new

Creates an authorization session for a particular device.

#### GET

Retrieves information about the created authorization session.

##### 200

```
{
    device_code: "1a1da233-099c-4434-9a3c-9d4bbecff192",
    user_code: "6b7-4450",
    expires_in: 1800,
    interval: 5,
    verification_url: "https://example.com/oauth24d/login"
}
```

Where:

+ device_code - `UUID`, 36 character hexadecimal representation of the particular authorization session for the device.
+ user_code - `UUID`, 8 character hexadecimal unique code to be presented to the user for use during authentication.
+ expires_in - `INT`, time in seconds after which the particular authorization session for the device is invalidated.
+ interval - `INT`, time in seconds at which the device should poll the service for an authorization result.
+ verification_url - `STRING`, url to be presented to the user directing them where to go to authenticate.

##### 500

Any content (optional) provided in a `500` response must provide additional information with regard to the failure.

### /poll

> Expected querystring: `device_code` - same value as given in a `GET /new` success response.

Retrieves credentials for the given authorization session.

#### GET

Polls a given authorization session to determine if credentials have been supplied. This endpoint is expected
to be polled at the `interval` provided as given in a `GET /new` success response.

##### 200

```
{
    access_token: "aigojeroigjegrg3h48943759347t298g34guj39vj48932893=="
}
```

Where:

+ access_token - `STRING`, representation of a user credential, as determined by the backing authorization provider.

##### 400

> Note: Some implementations may assign meaning to specific `error` descriptors,
refer to [Poll Explicit Erroring](#poll-explicit-erroring).

```
{
    error: "pending"
}
```

Where:

+ error - `STRING`, descriptor of the failure, indicating why we are unable to send a success response.

### /submit

> Note: This endpoint must be authenticated, to ensure only users with valid credentials may access it.

Submits credentials on behalf of an authenticated user.

#### POST

> Note: This endpoint expects `application/x-www-form-urlencoded` data be submitted in the body.

Completes credential handoff from authenticated users to a particular authorization session.

```
user_code=6b7-4450
```

Where:

+ user_code - `UUID`, same value as given in a `GET /new` success response.

##### 200

```
{
    status: "OK"
}
```

Where:

+ status - `STRING`, descriptor of the status of the operation.

##### 400

```
{
    error: "pending"
}
```

Where:

+ error - `STRING`, descriptor of the failure, indicating why we are unable to send a success response.

### /login

> Note: This endpoint must be authenticated, to ensure only users with valid credentials may access it.

Facilitates authenticated users credential handoff to a particular authorization session.

#### GET

Presents an interface with which users may submit `user_code` values to successfully authenticate a given authorization session.

##### 200

Responds with a `text/html` payload containing the necessary logic to submit a `user_code` to the [/submit](#submit) endpoint.

## Extensions

### Poll Explicit Erroring

> Note: This extends the [/poll](#poll) endpoint.

Provides structure to the `error` values received in a `GET /poll` failure response.

#### Invalid Request

> Note: the expectation is that the client will reissue the request.

A provider must respond with the following when the failure is caused by an inability to read the data received:

```
{
    error: "malformed request"
}
```

#### Code Expired

> Note: the expectation is that the client will terminiate the given authorization session
and request a new session if needed.

A provider must respond with the following when the failure is a result of the given authorization session having
received no valid authentication in the duration specified via `expires_in` in a `GET /new` success response:

```
{
    error: "code expired"
}
```

#### Pending Code

> Note: the expectation is that the client will continue to poll at the `interval`, as provided in a `GET /new` success response.

A provider must respond with the following when the failure is transient, and indicates no `user_code` has yet been
specified for the given authorization session:

```
{
    error: "pending"
}
```

## Examples

+ [Google OAuth2 For Devices](https://developers.google.com/identity/protocols/OAuth2ForDevices)
