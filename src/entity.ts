import { Column, ColumnType } from './column';
import { Repository } from './repository';

export class Entity<T> {
  schema = {} as Record<keyof T, ColumnType | string>;
  dataType: T;
  public readonly repository = new Repository<T>(this);

  constructor(
    public name: string,
    public columns: Column<keyof T>[]
  ) {
    columns.forEach((column) => {
      this.schema[column.name] =
        column.type instanceof Entity ? column.type.name : column.type;
    });
  }
}
