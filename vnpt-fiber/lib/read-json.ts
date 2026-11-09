export class InputError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export async function readSmallJson(
  request: Request,
  limit = 8192,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > limit) throw new InputError(413, "Thông tin quá dài.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError(400, "Không đọc được thông tin đăng ký.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new InputError(413, "Thông tin quá dài.");
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
  } catch {
    throw new InputError(400, "Không đọc được thông tin đăng ký.");
  }
}
