import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  transactionId: string;
}

class DeleteTransactionService {
  public async execute({ transactionId }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionToBeDeleted = await transactionsRepository.findOne({
      where: {
        id: transactionId,
      },
    });

    if (!transactionToBeDeleted) {
      throw new AppError('This transaction does not exist');
    }

    await transactionsRepository.remove(transactionToBeDeleted);
  }
}

export default DeleteTransactionService;
