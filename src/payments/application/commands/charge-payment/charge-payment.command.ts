export class ChargePaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
  ) {}
}
