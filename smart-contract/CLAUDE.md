
# when developing smart contracts, please
use development.md for detailed instructions

# Smart Contract Testing Procedure

When testing smart contracts, follow this systematic approach for each test file:

## Testing Process

For testing each script:

1. **Run compact command**: Execute `/compact` before starting each test

2. **Fetch contract function list**: Read `/contract/contract_function_list.md` to understand all available functions

3. **Fetch the contract under test**: Read the specific contract file to understand implementation details

4. **Verify test code alignment**:
   - Check all function names match contract implementations
   - Verify parameter counts and types are correct
   - Ensure event names match exactly

5. **Validate test coverage**:
   - Check all functions are tested
   - Verify edge cases are covered
   - Ensure both success and failure scenarios are tested
   - Confirm access control tests are included

6. **Execute the test**: Run the specific test script with output logging:
   ```bash
   npx truffle test test/<TestFile>.test.js 2>&1 | tee testing-logs/test_$(date +%Y%m%d_%H%M%S)_<TestFile>.log
   ```

7. **Analyze results**:
   - Read the log file
   - Check for errors and failures
   - Append analysis/conclusion at the start of the log file

8. **Proceed based on results**:
   - If all tests pass: Move to next test file (start from step 1 with `/compact`)
   - If tests fail: Fix the test script issues and retest

## Important Guidelines

- **DO NOT modify contracts** without explicit permission
- **Feel free to modify test scripts** to align with contract implementations
- Always run `/compact` after completing each test file
- Maintain detailed logs for troubleshooting

## Test Order

1. MasterAccessControl.test.js
2. NFTAccessControl.test.js
3. NFTContract.test.js
4. NFTMetadata.test.js
5. AIServiceAgreementManagement.test.js
6. Monetization.test.js
7. Integration.test.js

## Parallel Agent Testing Approach

For comprehensive and efficient testing, use parallel agents with fresh contexts:

### Overview
- Launch multiple agents simultaneously to analyze different test files
- Each agent receives a clean context with only necessary information
- Agents identify both test script fixes and potential contract issues
- Results are consolidated for review before any contract modifications

### Agent Workflow

1. **Preparation Phase**
   - Ensure `/contract/contract_function_list.md` is up to date
   - Create `/contract/testing-logs/` directory if not exists
   - Review `/contract/testing-logs/agent-testing-plan.md` for detailed instructions

2. **Parallel Agent Execution**
   - Launch 6-7 agents (one per test file) simultaneously
   - Each agent performs:
     - Read contract function list and relevant contract
     - Analyze test file for mismatches
     - Fix test script issues
     - Execute tests and log results
     - Report findings in standardized format

3. **Consolidation Phase**
   - Collect all agent reports
   - Create `/contract/testing-logs/testing-todo.md` with:
     - Summary of test fixes applied
     - List of contract issues discovered
     - Priority rankings for issues
   - Generate comprehensive summary report

4. **Contract Modification Phase**
   - Review consolidated findings
   - Request permission for any contract changes
   - Apply approved changes systematically
   - Re-run affected tests to verify fixes

### Agent Report Format
Each agent should provide:
```
## Test File: [filename]
### Test Fixes Applied:
- [List of changes made to test file]

### Contract Issues Discovered:
- [Any issues found in contract that need fixing]

### Test Results:
- Pass/Fail status
- Error details if any
- Recommendations
```

### Benefits of Parallel Approach
- Clean context for each test analysis
- Faster completion through parallelization
- Isolated analysis prevents cross-contamination
- Comprehensive issue identification

### When to Use Parallel vs Sequential
- **Parallel**: Initial analysis and test fixes
- **Sequential**: Contract modifications, integration testing