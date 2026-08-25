import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PaymentsController } from './interface/payments.controller';
import { Payment } from './infrastructure/entities/payment.entity';
import { PaymentTransaction } from './infrastructure/entities/payment-transaction.entity';
import { ChargePaymentHandler } from './application/commands/charge-payment/charge-payment.handler';
import { RefundPaymentHandler } from './application/commands/refund-payment/refund-payment.handler';

const CommandHandlers = [ChargePaymentHandler, RefundPaymentHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Payment, PaymentTransaction]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'payment',
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            consumer: {
              groupId: 'payment-consumer',
            },
          },
        }),
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [...CommandHandlers],
})
export class PaymentsModule {}
