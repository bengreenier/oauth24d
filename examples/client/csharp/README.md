# oauth24d csharp example

Implement oauth24d client using csharp :sparkles:

## Details

A dotnet sample client using netstandard2. First run `dotnet build`, and then consume `csharp.dll` to access the implementation yourself or `cd test && dotnet test` to run the automated tests. The sample contains inline xmldocs that should explain how to use it!

```
var client = new OAuth24DClient("code uri", "poll uri");

client.CodeComplete += (OAuth24DClient.CodeCompletionData codeData) =>
{
    Assert.Equal("1a1da233-099c-4434-9a3c-9d4bbecff192", codeData.device_code);
    Assert.Equal("6b7-4450", codeData.user_code);
    Assert.Equal(5, codeData.interval);
    Assert.Equal("https://example.com/oauth24d/login", codeData.verification_url);
    Assert.Equal(200, codeData.http_status);
};

client.AuthenticationComplete += (OAuth24DClient.AuthCompletionData authData) =>
{
    Assert.Equal("aigojeroigjegrg3h48943759347t298g34guj39vj48932893==", authData.access_token);
    Assert.Equal(200, authData.http_status);
};

client.Authenticate();
```
