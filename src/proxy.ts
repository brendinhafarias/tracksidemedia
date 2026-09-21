import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NOME_COOKIE = "sessao_token";
const ROTAS_PUBLICAS = ["/login"];

// Verificação leve (apenas presença do cookie) roda no edge.
// A validação completa da sessão (expiração, usuário ativo) acontece no
// layout do grupo (app) e na própria página de login, que têm acesso ao
// Prisma. Importante: aqui só bloqueamos rotas privadas sem cookie algum.
// Não redirecionamos "/login" -> "/" com base só na presença do cookie,
// porque um cookie de uma sessão já expirada/apagada (ex.: após um
// `db:seed`) causaria um loop de redirecionamento entre "/" e "/login".
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));
  const temCookie = request.cookies.has(NOME_COOKIE);

  if (!ehRotaPublica && !temCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
