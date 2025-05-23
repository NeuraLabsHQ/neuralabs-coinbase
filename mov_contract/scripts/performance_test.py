#!/usr/bin/env python3
"""
Performance Testing Script for NeuraLabs
Tests performance metrics and benchmarks for the system
"""

import asyncio
import time
import statistics
import json
import subprocess
from typing import List, Dict, Any
from datetime import datetime
from contract_interaction import NeuraLabsContract

class PerformanceTest:
    def __init__(self, config_file='../test-config.json'):
        with open(config_file) as f:
            self.config = json.load(f)
        
        self.contract = NeuraLabsContract(
            package_id=self.config['packageId'],
            collection_id=self.config.get('collectionId')
        )
        
        self.results = {
            'test_date': datetime.now().isoformat(),
            'network': self.config['network'],
            'benchmarks': {}
        }
    
    async def run_all_tests(self):
        """Run all performance tests"""
        print("🚀 NeuraLabs Performance Testing Suite")
        print("=" * 60)
        print(f"Network: {self.config['network']}")
        print(f"Start time: {datetime.now()}")
        print("=" * 60)
        
        # Run individual test suites
        await self.test_nft_operations()
        await self.test_access_control()
        await self.test_encryption_performance()
        await self.test_concurrent_operations()
        await self.test_gas_usage()
        
        # Generate report
        self.generate_report()
    
    async def test_nft_operations(self):
        """Test NFT creation and management performance"""
        print("\n📊 1. NFT Operations Performance")
        print("-" * 40)
        
        # Test NFT creation
        creation_times = []
        for i in range(10):
            start = time.time()
            try:
                result = self.contract.create_nft(
                    f"Performance Test NFT {i}",
                    f"Testing NFT creation performance iteration {i}",
                    4  # VIEW_DOWNLOAD level
                )
                creation_times.append(time.time() - start)
                print(f"  NFT {i+1}/10 created in {creation_times[-1]:.2f}s")
            except Exception as e:
                print(f"  NFT {i+1}/10 failed: {str(e)}")
        
        if creation_times:
            self.results['benchmarks']['nft_creation'] = {
                'average': statistics.mean(creation_times),
                'min': min(creation_times),
                'max': max(creation_times),
                'median': statistics.median(creation_times),
                'std_dev': statistics.stdev(creation_times) if len(creation_times) > 1 else 0
            }
            
            print(f"\n  Summary:")
            print(f"    Average: {self.results['benchmarks']['nft_creation']['average']:.2f}s")
            print(f"    Min/Max: {self.results['benchmarks']['nft_creation']['min']:.2f}s / {self.results['benchmarks']['nft_creation']['max']:.2f}s")
            print(f"    Median: {self.results['benchmarks']['nft_creation']['median']:.2f}s")
    
    async def test_access_control(self):
        """Test access control operations performance"""
        print("\n🔐 2. Access Control Performance")
        print("-" * 40)
        
        # Assume we have token_id 1 from previous tests
        token_id = 1
        test_users = [f"0x{i:064x}" for i in range(5)]
        
        # Test grant access
        grant_times = []
        for i, user in enumerate(test_users):
            start = time.time()
            try:
                self.contract.grant_access(token_id, user, 3)  # CREATE_REPLICA level
                grant_times.append(time.time() - start)
                print(f"  Grant access {i+1}/5: {grant_times[-1]:.2f}s")
            except Exception as e:
                print(f"  Grant access {i+1}/5 failed: {str(e)}")
        
        # Test revoke access
        revoke_times = []
        for i, user in enumerate(test_users):
            start = time.time()
            try:
                self.contract.revoke_access(token_id, user)
                revoke_times.append(time.time() - start)
                print(f"  Revoke access {i+1}/5: {revoke_times[-1]:.2f}s")
            except Exception as e:
                print(f"  Revoke access {i+1}/5 failed: {str(e)}")
        
        if grant_times:
            self.results['benchmarks']['access_control'] = {
                'grant': {
                    'average': statistics.mean(grant_times),
                    'min': min(grant_times),
                    'max': max(grant_times)
                },
                'revoke': {
                    'average': statistics.mean(revoke_times) if revoke_times else 0,
                    'min': min(revoke_times) if revoke_times else 0,
                    'max': max(revoke_times) if revoke_times else 0
                }
            }
            
            print(f"\n  Summary:")
            print(f"    Grant average: {self.results['benchmarks']['access_control']['grant']['average']:.2f}s")
            print(f"    Revoke average: {self.results['benchmarks']['access_control']['revoke']['average']:.2f}s")
    
    async def test_encryption_performance(self):
        """Test encryption/decryption performance (mocked)"""
        print("\n🔒 3. Encryption Performance (Mocked)")
        print("-" * 40)
        
        data_sizes = [
            (1024, "1KB"),
            (10240, "10KB"),
            (102400, "100KB"),
            (1048576, "1MB"),
            (10485760, "10MB")
        ]
        
        encryption_results = []
        
        for size, label in data_sizes:
            test_data = b"A" * size
            
            # Mock encryption timing
            start = time.time()
            encrypted = self._mock_encrypt(test_data)
            enc_time = time.time() - start
            
            # Mock decryption timing
            start = time.time()
            decrypted = self._mock_decrypt(encrypted)
            dec_time = time.time() - start
            
            throughput_enc = size / enc_time / 1024 / 1024  # MB/s
            throughput_dec = size / dec_time / 1024 / 1024  # MB/s
            
            result = {
                'size': size,
                'label': label,
                'encryption_time': enc_time,
                'decryption_time': dec_time,
                'encryption_throughput': throughput_enc,
                'decryption_throughput': throughput_dec
            }
            encryption_results.append(result)
            
            print(f"  {label}:")
            print(f"    Encryption: {enc_time:.3f}s ({throughput_enc:.1f} MB/s)")
            print(f"    Decryption: {dec_time:.3f}s ({throughput_dec:.1f} MB/s)")
        
        self.results['benchmarks']['encryption'] = encryption_results
    
    async def test_concurrent_operations(self):
        """Test system performance under concurrent load"""
        print("\n⚡ 4. Concurrent Operations Performance")
        print("-" * 40)
        
        async def create_nft_async(index):
            start = time.time()
            try:
                result = await asyncio.to_thread(
                    self.contract.create_nft,
                    f"Concurrent NFT {index}",
                    f"Testing concurrent creation {index}",
                    3
                )
                return time.time() - start, True
            except Exception as e:
                return time.time() - start, False
        
        # Test different concurrency levels
        concurrency_levels = [1, 5, 10, 20]
        concurrency_results = []
        
        for level in concurrency_levels:
            print(f"\n  Testing {level} concurrent operations...")
            
            start_total = time.time()
            tasks = [create_nft_async(i) for i in range(level)]
            results = await asyncio.gather(*tasks)
            total_time = time.time() - start_total
            
            successes = sum(1 for _, success in results if success)
            times = [t for t, success in results if success]
            
            result = {
                'concurrency': level,
                'total_time': total_time,
                'successes': successes,
                'failures': level - successes,
                'average_time': statistics.mean(times) if times else 0,
                'throughput': successes / total_time if total_time > 0 else 0
            }
            concurrency_results.append(result)
            
            print(f"    Total time: {total_time:.2f}s")
            print(f"    Success rate: {successes}/{level}")
            print(f"    Throughput: {result['throughput']:.2f} ops/s")
        
        self.results['benchmarks']['concurrency'] = concurrency_results
    
    async def test_gas_usage(self):
        """Analyze gas usage for different operations"""
        print("\n⛽ 5. Gas Usage Analysis")
        print("-" * 40)
        
        # This would require parsing transaction results for gas usage
        # For now, we'll use estimated values
        gas_estimates = {
            'create_collection': 5000000,
            'create_nft': 10000000,
            'grant_access': 5000000,
            'revoke_access': 5000000,
            'add_encrypted_data': 20000000,
            'transfer_nft': 8000000
        }
        
        print("  Estimated gas usage:")
        for operation, gas in gas_estimates.items():
            print(f"    {operation}: {gas:,} MIST")
        
        self.results['benchmarks']['gas_usage'] = gas_estimates
    
    def _mock_encrypt(self, data: bytes) -> bytes:
        """Mock encryption for performance testing"""
        # Simulate encryption overhead
        time.sleep(0.001 * len(data) / 1024)  # 1ms per KB
        return b"ENCRYPTED_" + data
    
    def _mock_decrypt(self, data: bytes) -> bytes:
        """Mock decryption for performance testing"""
        # Simulate decryption overhead
        time.sleep(0.0008 * len(data) / 1024)  # 0.8ms per KB
        return data[10:]  # Remove "ENCRYPTED_" prefix
    
    def generate_report(self):
        """Generate performance test report"""
        print("\n" + "=" * 60)
        print("📈 Performance Test Report")
        print("=" * 60)
        
        # Save results to file
        report_file = f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nReport saved to: {report_file}")
        
        # Print summary
        print("\n🎯 Key Metrics:")
        
        if 'nft_creation' in self.results['benchmarks']:
            print(f"\n  NFT Creation:")
            print(f"    Average time: {self.results['benchmarks']['nft_creation']['average']:.2f}s")
            print(f"    Throughput: {60/self.results['benchmarks']['nft_creation']['average']:.1f} NFTs/minute")
        
        if 'access_control' in self.results['benchmarks']:
            print(f"\n  Access Control:")
            print(f"    Grant access: {self.results['benchmarks']['access_control']['grant']['average']:.2f}s avg")
            print(f"    Revoke access: {self.results['benchmarks']['access_control']['revoke']['average']:.2f}s avg")
        
        if 'encryption' in self.results['benchmarks']:
            print(f"\n  Encryption Performance:")
            for result in self.results['benchmarks']['encryption']:
                if result['label'] == '1MB':
                    print(f"    1MB file: {result['encryption_throughput']:.1f} MB/s")
        
        if 'concurrency' in self.results['benchmarks']:
            print(f"\n  Concurrent Operations:")
            best_throughput = max(self.results['benchmarks']['concurrency'], 
                                key=lambda x: x['throughput'])
            print(f"    Best throughput: {best_throughput['throughput']:.2f} ops/s")
            print(f"    At concurrency: {best_throughput['concurrency']}")
        
        print("\n✅ Performance testing complete!")

# Main execution
if __name__ == "__main__":
    test = PerformanceTest()
    asyncio.run(test.run_all_tests())