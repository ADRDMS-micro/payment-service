import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id' })
  orderId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  status!: string; // e.g., PENDING, SUCCESS, FAILED

  @OneToMany(() => PaymentTransaction, (txn) => txn.payment, { cascade: true })
  transactions!: PaymentTransaction[];

  @CreateDateColumn()
  createdAt!: Date;
}
