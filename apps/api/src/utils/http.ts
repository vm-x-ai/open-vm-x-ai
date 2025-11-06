import { FastifyRequest } from 'fastify';

export function getSourceIpFromRequest(request: FastifyRequest) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedForValue = forwardedFor
    ? Array.isArray(forwardedFor)
      ? forwardedFor[0]?.split(',')?.[0]?.trim()
      : forwardedFor?.split(',')?.[0]?.trim()
    : undefined;

  return forwardedForValue ?? request.ip;
}
