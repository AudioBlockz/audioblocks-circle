import { WalletService } from './../services/Dynamic/WalletService';

import { handleError } from '../utils/helpers';
import { Request, Response } from 'express';
import { erc20Abi, formatUnits } from 'viem';
import { arcPublicClient } from '../config/arc';
import { ArcContractAddress } from '../utils/arcContracts';

// Real USDC on Arc Testnet (see arcContracts.ts) uses 6 decimals.
const TOKEN_DECIMALS = 6;

export class WalletController {

    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
    }

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

    createEvmWallet = async(req: Request, res: Response) => {
        try {
            const wallet = await this.walletService.createWallet();
            res.status(201).json({success: true, message: "Wallet created successfully", wallet});
        
        } catch (error) {
            handleError(res, error);
        }
    }

    signMessage = async(req: Request, res: Response) => {
        try {
            const payload = req.body;
            const signature = await this.walletService.signMessage(payload);
            res.status(200).json({success: true, message: "Message signed successfully", signature});
        
        } catch (error) {
            handleError(res, error);
        }
    }
    
}