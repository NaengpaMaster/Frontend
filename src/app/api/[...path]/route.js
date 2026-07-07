const BACKEND_URL = process.env.BACKEND_URL;

async function proxy(request, { params }) {
  const { path } = await params;
  const backendUrl = new URL(`/api/${path.join('/')}`, BACKEND_URL);
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('origin');
  headers.delete('referer');

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-encoding');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
