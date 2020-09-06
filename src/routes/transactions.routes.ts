import { Router } from 'express';

// import TransactionsRepository from '../repositories/TransactionsRepository';
import { getCustomRepository } from 'typeorm';
import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

// const transactionRepository = new TransactionsRepository();

transactionsRouter.get('/', async (_, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const balance = await transactionsRepository.getBalance();

  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const transactionService = new CreateTransactionService();

  const transaction = await transactionService.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute({ id });

  return response.send(204).json({});
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO
  const importTransaction = new ImportTransactionsService();

  const transactions = await importTransaction.execute();
  return response.json(transactions);
});

export default transactionsRouter;
