import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: string;
  value: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const currentBalance = await transactionsRepository.getBalance();

    if (type === 'outcome' && Number(value) > currentBalance.total) {
      throw new AppError(
        'The outcome should not be greater than the total balance',
      );
    }

    const categoryItem = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryItem) {
      const { identifiers } = await categoriesRepository.insert({
        title: category,
      });

      const insertedCategoryId = identifiers[0].id as string;

      const transaction = transactionsRepository.create({
        title,
        type: type === 'income' ? 'income' : 'outcome',
        value: parseFloat(value),
        category_id: insertedCategoryId,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }
    const transaction = transactionsRepository.create({
      title,
      type: type === 'income' ? 'income' : 'outcome',
      value: parseFloat(value),
      category_id: categoryItem.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
