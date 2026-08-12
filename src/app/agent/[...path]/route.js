const AGENT_URL = process.env.AGENT_BASE_URL
  || process.env.NEXT_PUBLIC_AGENT_BASE_URL
  || 'http://127.0.0.1:8000';

async function proxy(request, { params }) {
  const { path } = await params;
  const agentUrl = new URL(`/agent/${path.join('/')}`, AGENT_URL);
  agentUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('origin');
  headers.delete('referer');

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const response = await fetch(agentUrl, {
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
