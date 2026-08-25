import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { ChargePaymentCommand } from './charge-payment.command';
import { Payment } from '../../../infrastructure/entities/payment.entity';
import { PaymentTransaction } from '../../../infrastructure/entities/payment-transaction.entity';

@CommandHandler(ChargePaymentCommand)
export class ChargePaymentHandler implements ICommandHandler<ChargePaymentCommand> {
  private readonly logger = new Logger(ChargePaymentHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private txnRepo: Repository<PaymentTransaction>,
  ) {}

  async execute(command: ChargePaymentCommand): Promise<void> {
    const { orderId, amount } = command;
    this.logger.log(
      `[CQRS] Đang xử lý ChargePaymentCommand cho đơn: ${orderId}`,
    );

    // Giả lập 90% thành công
    const isSuccess = Math.random() < 0.9;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';
    const eventName = isSuccess ? 'payment.charged' : 'payment.failed';

    let payment = this.paymentRepo.create({
      orderId,
      amount,
      status,
    });
    payment = await this.paymentRepo.save(payment);

    const transaction = this.txnRepo.create({
      payment,
      paymentId: payment.id,
      transactionType: 'CHARGE',
      amount,
      status,
      gatewayResponse: { simulated: true, success: isSuccess },
    });
    await this.txnRepo.save(transaction);

    // Bắn event trả về Kafka
    this.kafkaClient.emit(eventName, {
      orderId,
      paymentId: payment.id,
      status,
      amount,
    });

    this.logger.log(
      `[CQRS] Xong thanh toán đơn: ${orderId}, kết quả: ${status}`,
    );
  }
}
