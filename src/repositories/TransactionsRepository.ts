import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const finalBalance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    transactions.forEach(currentTransaction => {
      if (currentTransaction.type === 'income') {
        finalBalance.income += Number(currentTransaction.value);
        finalBalance.total += Number(currentTransaction.value);
      } else {
        finalBalance.outcome += Number(currentTransaction.value);
        finalBalance.total -= Number(currentTransaction.value);
      }
    });

    return finalBalance;
  }
}

export default TransactionsRepository;
