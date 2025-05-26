import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';
import { nfts, wallet } from '@blockchain/index';
import MintNFTForm from './components/MintNFTForm';
import NFTList from './components/NFTList';
import NFTStats from './components/NFTStats';

export default function NFTManager({ config }) {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [userNFTs, setUserNFTs] = useState([]);
  const [totalNFTCount, setTotalNFTCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (currentAccount?.address) {
      loadUserNFTs();
      loadTotalCount();
    }
  }, [currentAccount]);

  const loadUserNFTs = async () => {
    if (!currentAccount?.address) return;
    
    try {
      setLoading(true);
      const nftList = await nfts.getUserNFTs(client, config, currentAccount.address);
      setUserNFTs(nftList);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  const loadTotalCount = async () => {
    try {
      const count = await nfts.getTotalNFTCount(client, config);
      setTotalNFTCount(count);
    } catch (error) {
      console.error('Error loading NFT count:', error);
    }
  };

  const handleMintNFT = async (nftData) => {
    try {
      wallet.checkWalletConnection(currentAccount);
      setMinting(true);
      
      const result = await nfts.mintNFT(
        client,
        config,
        currentAccount,
        signAndExecuteTransaction,
        nftData
      );
      
      toast.success('NFT minted successfully!');
      
      // Reload NFTs and count
      await Promise.all([loadUserNFTs(), loadTotalCount()]);
      
      return result;
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error(error.message || 'Failed to mint NFT');
      throw error;
    } finally {
      setMinting(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-300">Please connect your wallet to manage NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">NFT Manager</h1>
        
        <NFTStats 
          userNFTCount={userNFTs.length}
          totalNFTCount={totalNFTCount}
          userAddress={currentAccount.address}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            <MintNFTForm 
              onMint={handleMintNFT}
              minting={minting}
            />
          </div>
          
          <div className="lg:col-span-2">
            <NFTList 
              nfts={userNFTs}
              loading={loading}
              onRefresh={loadUserNFTs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}