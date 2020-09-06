// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    // Cannot allow to create transaction without balance
    const { total } = await transactionRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid type');
    }

    if (type === 'outcome' && value > total) {
      throw new AppError(
        'Not be able to create outcome transaction without a valid balance',
      );
    }
    // Verify title category exists
    const categoryExist = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    let categorySave = {
      title,
      type,
      value,
      category_id: '',
    };

    if (!categoryExist) {
      // Salvar category
      const categoryCreated = categoryRepository.create({
        title: category,
      });

      // Criar a categoria
      const categorySaved = await categoryRepository.save(categoryCreated);

      categorySave = { ...categorySave, category_id: categorySaved.id };
    } else {
      categorySave = { ...categorySave, category_id: categoryExist.id };
    }

    // Cria transaction
    const transaction = await transactionRepository.save(categorySave);

    return transaction;
  }
}

export default CreateTransactionService;
