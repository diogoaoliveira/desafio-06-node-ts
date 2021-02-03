import path from 'path';
import fs from 'fs';
import parse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  fileName: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, fileName);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const transactionRecords: TransactionCSV[] = [];
    const categorySet = new Set();

    const parser = fs.createReadStream(filePath).pipe(
      parse({
        from_line: 2,
      }),
    );

    // eslint-disable-next-line no-restricted-syntax
    for await (const record of parser) {
      const [title, type, value, category] = record.map((line: string) =>
        line.trim(),
      );

      transactionRecords.push({ title, type, value, category });
      categorySet.add(category);
    }

    const categoryRecords = Array.from(categorySet) as string[];

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categoryRecords),
      },
    });

    const existentCategoryTitles = existentCategories.map(
      existentCategory => existentCategory.title,
    );

    const categoriesToBeAdded = categoryRecords.filter(
      record => !existentCategoryTitles.includes(record),
    );

    const categories = categoriesRepository.create(
      categoriesToBeAdded.map(title => ({ title })),
    );

    await categoriesRepository.save(categories);

    const updatedCategories = [...existentCategories, ...categories];

    const transactionsToBeAdded = transactionRecords.map(record => ({
      title: record.title,
      type: record.type,
      value: record.value,
      category_id: updatedCategories.find(
        category => category.title === record.category,
      )?.id,
    }));

    const transactions = transactionsRepository.create(transactionsToBeAdded);

    await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
