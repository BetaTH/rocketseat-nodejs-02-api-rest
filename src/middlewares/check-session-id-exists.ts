import { FastifyReply, FastifyRequest } from 'fastify'

export async function checkSessionIdExits(
  req: FastifyRequest,
  res: FastifyReply,
) {
  const seesionId = req.cookies.sessionId

  if (!seesionId) {
    return res.status(401).send({ error: 'Unauthorized!' })
  }
}
