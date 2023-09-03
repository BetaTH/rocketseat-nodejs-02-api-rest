import { expect, beforeAll, afterAll, describe, it, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New Transation',
      amount: 500,
      type: 'credit',
    })

    expect(response.statusCode).toEqual(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transation',
        amount: 500,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')
    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transation',
        amount: 500,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const createTransactionReponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transation',
        amount: 500,
        type: 'credit',
      })

    const cookies = createTransactionReponse.get('Set-Cookie')
    const id = createTransactionReponse.body[0].id

    const specificTransactionReponse = await request(app.server)
      .get(`/transactions/${id}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(specificTransactionReponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transation',
        amount: 500,
      }),
    )
  })

  it('should be able to get summary', async () => {
    const createTransactionReponse1 = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transation',
        amount: 5000,
        type: 'credit',
      })
    const cookies = createTransactionReponse1.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'New Transation',
        amount: 500,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          amount: 4500,
        }),
      }),
    )
  })
})
