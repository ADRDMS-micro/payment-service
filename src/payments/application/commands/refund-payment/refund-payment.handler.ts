import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { RefundPaymentCommand } from './refund-payment.command';
import { Payment } from '../../../infrastructure/entities/payment.entity';
import { PaymentTransaction } from '../../../infrastructure/entities/payment-transaction.entity';

@CommandHandler(RefundPaymentCommand)
export class RefundPaymentHandler implements ICommandHandler<RefundPaymentCommand> {
  private readonly logger = new Logger(RefundPaymentHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private txnRepo: Repository<PaymentTransaction>,
  ) {}

  async execute(command: RefundPaymentCommand): Promise<void> {
    const { orderId, reason } = command;
    this.logger.log(
      `[CQRS] Đang xử lý RefundPaymentCommand cho đơn: ${orderId}`,
    );

    const payment = await this.paymentRepo.findOne({
      where: { orderId, status: 'SUCCESS' },
    });
    if (!payment) {
      this.logger.warn(
        `Không tìm thấy giao dịch SUCCESS cho đơn ${orderId} để hoàn tiền`,
      );
      this.kafkaClient.emit('payment.refund.failed', {
        orderId,
        reason: 'Payment not found',
      });
      return;
    }

    const transaction = this.txnRepo.create({
      payment,
      paymentId: payment.id,
      transactionType: 'REFUND',
      amount: payment.amount,
      status: 'SUCCESS',
      gatewayResponse: {
        simulated: true,
        refundReason: reason || 'Saga Compensation',
      },
    });
    await this.txnRepo.save(transaction);

    payment.status = 'REFUNDED';
    await this.paymentRepo.save(payment);

    this.kafkaClient.emit('payment.refunded', {
      orderId,
      paymentId: payment.id,
      status: 'REFUNDED',
    });
  }
}
