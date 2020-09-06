import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    // Busca se existe na base

    const transactionExist = await transactionRepository.findOne(id);

    if (!transactionExist) {
      throw new AppError('Transaction not found');
    }

    await transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;
