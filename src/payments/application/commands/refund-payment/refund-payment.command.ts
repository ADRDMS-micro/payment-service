export class RefundPaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly reason?: string,
  ) {}
}
