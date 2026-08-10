const BACKEND_URL = process.env.BACKEND_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:8080';

export async function GET(request, { params }) {
  const { provider } = await params;
  const backendUrl = new URL(`/login/oauth2/code/${provider}`, BACKEND_URL);
  backendUrl.search = request.nextUrl.search;
  return Response.redirect(backendUrl.toString(), 302);
}
