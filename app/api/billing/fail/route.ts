export async function GET(request: Request) {
  const input = new URL(request.url);
  const output = new URL("/app.html", request.url);
  output.searchParams.set("billing", "failed");
  output.searchParams.set("message", (input.searchParams.get("message") ?? "카드 등록이 취소되었습니다.").slice(0, 120));
  return Response.redirect(output, 303);
}
