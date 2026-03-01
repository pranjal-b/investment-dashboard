declare module "xirr" {
  function xirr(
    transactions: Array<{ amount: number; when: Date }>,
    options?: { guess?: number }
  ): number;
  export default xirr;
}
