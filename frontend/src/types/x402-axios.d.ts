declare module 'x402-axios' {
  import { AxiosInstance } from 'axios';

  interface WalletClient {
    account: {
      address: string;
    };
    chain: {
      id: number;
      name: string;
    };
    signTypedData: (typedData: any) => Promise<string>;
  }

  export function withPaymentInterceptor(axiosInstance: AxiosInstance, walletClient: WalletClient): AxiosInstance;
  
  export interface PaymentDetails {
    txHash?: string;
    transactionHash?: string;
    network?: string;
    amount?: string;
    token?: string;
    from?: string;
    to?: string;
  }
  
  export function decodeXPaymentResponse(header: string): PaymentDetails;
}