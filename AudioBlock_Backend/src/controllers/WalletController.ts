import { handleError } from '../utils/helpers';
import { Request, Response } from 'express';
import { erc20Abi, formatUnits } from 'viem';
import { arcPublicClient } from '../config/arc';
import { ArcContractAddress } from '../utils/arcContracts';

// Real USDC on Arc Testnet (see arcContracts.ts) uses 6 decimals.
const TOKEN_DECIMALS = 6;

export class WalletController {

    // The real on-chain balance of the caller's own app wallet (the Circle
    // developer-controlled wallet, not any wallet connected in a browser
    // extension — see the "Deposits are paid from your app wallet" note on
    // the Community page for why those are different addresses).
    getBalance = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const balance = (await arcPublicClient.readContract({
                address: ArcContractAddress.PaymentToken,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [user.walletAddress],
            })) as bigint;

            res.status(200).json({
                success: true,
                data: {
                    walletAddress: user.walletAddress,
                    balance: formatUnits(balance, TOKEN_DECIMALS),
                },
            });
        } catch (error) {
            handleError(res, error);
        }
    };
}