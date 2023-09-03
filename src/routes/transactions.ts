import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExits } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExits] }, async (req, res) => {
    const { sessionId } = req.cookies
    const transactions = await knex('transactions')
      .select('*')
      .where('session_id', sessionId)
    return res.status(200).send({ transactions })
  })

  app.get('/:id', { preHandler: [checkSessionIdExits] }, async (req, res) => {
    const { sessionId } = req.cookies
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getTransactionParamsSchema.parse(req.params)

    const transaction = await knex('transactions')
      .where({ session_id: sessionId, id })
      .first()

    return res.status(200).send({ transaction })
  })

  app.get('/summary', { preHandler: [checkSessionIdExits] }, async (req) => {
    const { sessionId } = req.cookies
    const summary = await knex('transactions')
      .where({ session_id: sessionId })
      .sum('amount', { as: 'amount' })
      .first()
    return { summary }
  })

  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    let seesionId = req.cookies.sessionId

    if (!seesionId) {
      seesionId = randomUUID()
      res.cookie('sessionId', seesionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
      })
    }

    const transaction = await knex('transactions')
      .insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: seesionId,
      })
      .returning('*')

    return res.status(201).send(transaction)
  })
}
