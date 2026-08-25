import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ name: 'payment_id' })
  paymentId!: string;

  @Column({ name: 'transaction_type' })
  transactionType!: string; // CHARGE, REFUND

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  status!: string; // SUCCESS, FAILED

  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
