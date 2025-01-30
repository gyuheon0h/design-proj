export class InvalidFieldUpdateError extends Error {
  constructor(fieldName: string) {
    super(`Cannot update '${fieldName}' directly. Use softDelete instead.`);
    this.name = 'InvalidFieldUpdateError';
  }
}
