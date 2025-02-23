import { Entity } from './entity';

export enum ColumnType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SERIAL = 'serial',
}

export class Column<T> {
  constructor(
    public name: T,
    public type: ColumnType | Entity<any>
  ) {}
}
