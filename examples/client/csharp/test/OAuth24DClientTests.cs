using Xunit;
using Moq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System;

/// <summary>
/// We could greatly improve test coverage here, but as this is sample code
/// we've focused on just ensure base cases work
/// </summary>
public class OAuth24DClientTests
{
	public class HttpMessageHandlerStub : HttpMessageHandler
	{
		private Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler;

		public HttpMessageHandlerStub(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
		{
			this.handler = handler;
		}

		protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
		{
			return this.handler(request, cancellationToken);
		}
	}

	[Fact]
    public async void Authenticate_Succeeds()
    {
		var mockInvoker = new HttpMessageHandlerStub((HttpRequestMessage req, CancellationToken token) =>
		{
			var res = new HttpResponseMessage();
			res.RequestMessage = req;
			res.Version = new Version(1, 1);

			if (req.RequestUri.AbsolutePath == "/code")
			{
				res.Content = new StringContent("{\"device_code\": \"1a1da233-099c-4434-9a3c-9d4bbecff192\",\"user_code\": \"6b7-4450\",\"expires_in\": 1800,\"interval\": 5,\"verification_url\": \"https://example.com/oauth24d/login\"}");
				res.StatusCode = HttpStatusCode.OK;
				res.ReasonPhrase = HttpStatusCode.OK.ToString();
			}
			else if (req.RequestUri.AbsolutePath == "/poll")
			{
				res.Content = new StringContent("{\"access_token\": \"aigojeroigjegrg3h48943759347t298g34guj39vj48932893==\"}");
				res.StatusCode = HttpStatusCode.OK;
				res.ReasonPhrase = HttpStatusCode.OK.ToString();
			}
			else
			{
				res.StatusCode = HttpStatusCode.InternalServerError;
				res.ReasonPhrase = HttpStatusCode.InternalServerError.ToString();
			}

			return Task.FromResult(res);
		});

		// we'll use these to ensure our handlers are given time to run
		TaskCompletionSource<int> codeCompleteSrc = new TaskCompletionSource<int>();
		TaskCompletionSource<int> authCompleteSrc = new TaskCompletionSource<int>();

		HttpClient httpClient = new HttpClient(mockInvoker); 
		OAuth24DClient client = new OAuth24DClient("http://example.com/code", "http://example.com/poll", httpClient);

		client.CodeComplete += (OAuth24DClient.CodeCompletionData codeData) =>
		{
			try
            {
                Assert.Equal("1a1da233-099c-4434-9a3c-9d4bbecff192", codeData.device_code);
                Assert.Equal("6b7-4450", codeData.user_code);
                Assert.Equal(5, codeData.interval);
                Assert.Equal("https://example.com/oauth24d/login", codeData.verification_url);
                Assert.Equal(200, codeData.http_status);
            }
            catch (Exception ex)
            {
				codeCompleteSrc.SetException(ex);
            }

			codeCompleteSrc.SetResult(0);
		};

		client.AuthenticationComplete += (OAuth24DClient.AuthCompletionData authData) =>
		{
            try
            {
                Assert.Equal("aigojeroigjegrg3h48943759347t298g34guj39vj48932893==", authData.access_token);
                Assert.Equal(200, authData.http_status);
            }
            catch (Exception ex)
            {
                authCompleteSrc.SetException(ex);
            }

			authCompleteSrc.SetResult(0);
		};
		
		Assert.True(client.Authenticate());

		// wait until the handlers are fired and validated
		await Task.WhenAll(codeCompleteSrc.Task, authCompleteSrc.Task);
	}

	[Fact]
	public async void Authenticate_Fails()
	{
		var mockInvoker = new HttpMessageHandlerStub((HttpRequestMessage req, CancellationToken token) =>
		{
			var res = new HttpResponseMessage();
			res.RequestMessage = req;
			res.Version = new Version(1, 1);
			res.StatusCode = HttpStatusCode.InternalServerError;
			res.ReasonPhrase = HttpStatusCode.InternalServerError.ToString();

			return Task.FromResult(res);
		});

		// we'll use these to ensure our handlers are given time to run
		TaskCompletionSource<int> codeCompleteSrc = new TaskCompletionSource<int>();

		HttpClient httpClient = new HttpClient(mockInvoker);
		OAuth24DClient client = new OAuth24DClient("http://example.com/code", "http://example.com/poll", httpClient);

		client.CodeComplete += (OAuth24DClient.CodeCompletionData codeData) =>
		{
			try
			{
				Assert.Null(codeData.device_code);
				Assert.Null(codeData.user_code);
				Assert.Equal(0, codeData.interval);
				Assert.Null(codeData.verification_url);
				Assert.Equal(500, codeData.http_status);
			}
			catch (Exception ex)
			{
				codeCompleteSrc.SetException(ex);
			}

			codeCompleteSrc.SetResult(0);
		};
		
		Assert.True(client.Authenticate());

		// wait until the handlers are fired and validated
		await codeCompleteSrc.Task;
	}
}