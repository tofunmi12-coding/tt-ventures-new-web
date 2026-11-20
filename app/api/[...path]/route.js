import { handleApi } from "../../../lib/api";

async function dispatch(request, context) {
  const { path } = await context.params;
  return handleApi(request, path);
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
