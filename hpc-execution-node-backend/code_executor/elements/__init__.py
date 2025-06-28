# Flow Control
from .flow_control.start import Start
from .flow_control.end import End
from .flow_control.case import Case
from .flow_control.flow_select import FlowSelect

# Inputs
from .inputs.chat_input import ChatInput
from .inputs.context_history import ContextHistory
from .inputs.datablocks import Datablocks
from .inputs.rest_api import RestAPI
from .inputs.metadata import Metadata
from .inputs.constants import Constants

# Onchain
from .onchain.read_blockchain_data import ReadBlockchainData
from .onchain.build_transaction_json import BuildTransactionJSON

# Util
from .util.selector import Selector
from .util.merger import Merger
from .util.random_generator import RandomGenerator
from .util.time_block import TimeBlock

# AI
from .ai.llm_text import LLMText
from .ai.llm_structured import LLMStructured

# Custom
from .custom.custom import Custom

# MCP
from .mcp.duckduckgo_search import DuckDuckGoSearch

# Coinbase

from .coinbase.fetch_balance import FetchBalance as CoinbaseFetchBalance
from .coinbase.read_contract import ReadContract as CoinbaseReadContract

# Akash
from .akash.chat_api import ChatAPI

# AWS
from .aws.titan import Titan
from .aws.nova import Nova


# Registry of element types to their classes
element_registry = {
    "start": Start,
    "end": End,
    "case": Case,
    "flow_select": FlowSelect,
    "chat_input": ChatInput,
    "context_history": ContextHistory,
    "datablock": Datablocks,
    "rest_api": RestAPI,
    "metadata": Metadata,
    "constants": Constants,
    "read_blockchain_data": ReadBlockchainData,
    "buildtransaction": BuildTransactionJSON,
    "selector": Selector,
    "merger": Merger,
    "random_generator": RandomGenerator,
    "time": TimeBlock,
    "llm_text": LLMText,
    "llm_structured": LLMStructured,
    "custom": Custom,
    "duckduckgo_search": DuckDuckGoSearch,
    "DuckDuckGoSearch": DuckDuckGoSearch,
    "search": DuckDuckGoSearch,  # Backward compatibility
    "randomgenerator": RandomGenerator,
    
    "fetchbalance": CoinbaseFetchBalance,
    "FetchBalance": CoinbaseFetchBalance,  # Map YAML type to Coinbase implementation
    "coinbase_read_contract": CoinbaseReadContract,
    "readcontract": CoinbaseReadContract,  # Map common name to Coinbase implementation
    
    # Akash
    "ChatAPI": ChatAPI,
    "chat_api": ChatAPI,
    "akash_chat": ChatAPI,
    "chatapi": ChatAPI,
    
    # AWS
    "Titan": Titan,
    "titan": Titan,
    "Nova": Nova,
    "nova": Nova,
}