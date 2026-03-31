import { HttpException, HttpStatus } from '@nestjs/common';

export class OrderNotFoundError extends HttpException {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedOrderAccessError extends HttpException {
  constructor() {
    super('Not authorized to access this order', HttpStatus.FORBIDDEN);
  }
}

export class InvalidOrderStateError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class ReceiptParsingError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
