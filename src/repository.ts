import { ColumnType } from './column';
import { Entity } from './entity';
import { JsonDB } from './json-db';

export class Repository<DataType> {
  private table: DataType[] = undefined;

  constructor(private entity: Entity<DataType>) {}

  private getNextValueForColumn(
    column: keyof DataType,
    table: DataType[]
  ): number {
    if (table.length === 0) return 1;

    const res = table[table.length - 1][column];

    if (typeof res !== 'number') return 1;

    return res + 1;
  }

  private async getTable(): Promise<DataType[]> {
    if (this.table) return this.table;
    this.table = await JsonDB.getTable(this.entity.name);
    return this.table;
  }

  async exists(where: Partial<DataType>): Promise<boolean> {
    const table = await this.getTable();
    return table.some((data: DataType) =>
      Object.entries(where).every(([key, value]) => data[key] === value)
    );
  }

  async save<T = DataType | DataType[]>(dataOrArray: T): Promise<T> {
    const array = Array.isArray(dataOrArray) ? dataOrArray : [dataOrArray];

    const table = await this.getTable();

    for (const data of array) {
      for (const column of this.entity.columns) {
        if (column instanceof Entity) {
          //check if the value already exists
          const exists = await column.repository.exists({
            [column.name]: data[column.name],
          });
          if (!exists) {
            throw new Error(`Foreign key ${column.name} does not exist`);
          }
        } else if (column.type == ColumnType.SERIAL) {
          data[column.name] = this.getNextValueForColumn(
            column.name,
            table
          ) as any;
        }
      }
      table.push(data);
    }

    JsonDB.saveTable(this.entity.name, table);

    return dataOrArray;
  }

  async find({
    where,
    order,
  }: {
    where?: Partial<DataType>;
    order?: Partial<Record<keyof DataType, 'ASC' | 'DESC'>>;
  }): Promise<DataType[]> {
    const table = await this.getTable();

    const res = table.filter((data: DataType) =>
      Object.entries(where ?? {}).every(([key, value]) => data[key] === value)
    );

    if (order) {
      const key = Object.keys(order)[0];
      res.sort((a: DataType, b: DataType) => {
        if (order[key] === 'ASC') {
          return a[key] > b[key] ? 1 : -1;
        } else {
          return a[key] < b[key] ? 1 : -1;
        }
      });
    }
    return res;
  }

  async delete(where: Partial<DataType>): Promise<void> {
    const table = await this.getTable();

    if (Object.keys(where).length === 0) return;

    const filtered = table.filter(
      (data: DataType) =>
        !Object.entries(where).every(([key, value]) => data[key] === value)
    );
    JsonDB.saveTable(this.entity.name, filtered);
  }

  async findOne(where?: Partial<DataType>): Promise<DataType | null> {
    const table = await this.getTable();
    return table.find((data: DataType) =>
      Object.entries(where ?? {}).every(([key, value]) => data[key] === value)
    );
  }

  async update(
    where: Partial<DataType>,
    data: Partial<DataType>
  ): Promise<DataType | null> {
    const table = await this.getTable();

    table.forEach((oldData: DataType) => {
      const isMatch = Object.entries(where).every(
        ([key, value]) => oldData[key] === value
      );
      if (isMatch)
        Object.entries(data).forEach(([key, value]) => {
          oldData[key] = value;
        });
    });

    JsonDB.saveTable(this.entity.name, table);
    return data as DataType;
  }
}
