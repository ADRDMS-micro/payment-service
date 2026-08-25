import { Controller } from '@nestjs/common';
import { Payload, EventPattern } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { ChargePaymentCommand } from '../application/commands/charge-payment/charge-payment.command';
import { RefundPaymentCommand } from '../application/commands/refund-payment/refund-payment.command';
import type { ChargePaymentRequest } from '../application/commands/charge-payment/charge-payment.dto';
import type { RefundPaymentRequest } from '../application/commands/refund-payment/refund-payment.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('payment.charge.command')
  async handleChargePayment(
    @Payload() message: ChargePaymentRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChargePaymentCommand(message.orderId, message.amount),
    );
  }

  @EventPattern('payment.refund.command')
  async handleRefundPayment(
    @Payload() message: RefundPaymentRequest,
  ): Promise<void> {
    await this.commandBus.execute(
      new RefundPaymentCommand(message.orderId, message.reason),
    );
  }
}
