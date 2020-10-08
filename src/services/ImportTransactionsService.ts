import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';

import { getRepository, In, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(): Promise<Transaction[]> {
    // TODO
    const categoriesRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const csvFilePath = path.resolve(
      __dirname,
      '../__tests__/import_template.csv',
    );

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    // Envia informacao de uma stream para outra
    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    /**
     * Metodo In verifica se alguma dessas categorias do array de categories está na base de dados
     */
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // Pegar somente title
    const existentCategoriesTitle = existentCategories.map(
      (item: Category) => item.title,
    );
    // Filtrar categorias que não estão salvas na base de dados
    const addCategoriyTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // Criar as categorias
    const newCategories = categoriesRepository.create(
      addCategoriyTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const categoriesFinal = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categoriesFinal.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepository.save(createdTransactions);
    // Tratar duplicados

    return createdTransactions;
  }
}

export default ImportTransactionsService;
