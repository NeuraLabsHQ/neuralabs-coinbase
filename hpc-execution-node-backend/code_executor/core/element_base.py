# core/element_base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from .schema import HyperparameterSchema, AccessLevel

class ElementBase(ABC):
    """Base class for all flow elements."""
    
    def __init__(self, element_id: str, name: str, element_type: str, 
                 description: str, input_schema: Dict[str, Any], 
                 output_schema: Dict[str, Any],
                 node_description: Optional[str] = None,
                 processing_message: Optional[str] = None,
                 tags: Optional[List[str]] = None,
                 layer: int = 1,
                 parameters: Optional[Dict[str, Any]] = None,
                 hyperparameters: Optional[Dict[str, HyperparameterSchema]] = None,
                 parameter_schema_structure: Optional[Dict[str, Any]] = None):
        self.element_id = element_id
        self.name = name
        self.element_type = element_type
        self.node_description = node_description or description  # Fixed description from L1
        self.description = description  # Customizable description
        self.processing_message = processing_message or f"Processing {name}..."
        self.tags = tags or []
        self.layer = layer
        self.input_schema = input_schema
        self.output_schema = output_schema
        self.parameters = parameters or {}
        self.hyperparameters = hyperparameters or {}
        self.parameter_schema_structure = parameter_schema_structure or {}
        self.inputs = {}
        self.outputs = {}
        self.executed = False
        self.downwards_execute = True  # Controls forward flow
        self.connections = []  # Downstream elements
        self.dependencies = []  # Upstream elements
        self.output_map = []  # output_map[dependencie_element_id][output_variable][input_variable]
        
    def connect(self, element: 'ElementBase'):
        """Connect this element to another element downstream."""
        self.connections.append(element)
        element.dependencies.append(self)
    
    # def map_output_to_input(self, dependency_element_id: str, output_variable: str, input_variable: str):
        
    #     self.input_map.setdefault(dependency_element_id, {})
        
    #     self.input_map[dependency_element_id].setdefault(output_variable, [])
        
    #     self.input_map[dependency_element_id][output_variable].append(input_variable)
    
    def map_output_to_input(self, dependent_element: 'ElementBase', output_variable: str, input_variable: str):
        
        """Map an output variable from a dependency to an input variable."""
        self.output_map.append({
            "dependent_element": dependent_element,
            "output_variable": output_variable,
            "input_variable": input_variable
        })

    
    
    def set_input(self, input_name: str, value: Any):
        """Set an input value."""
        self.inputs[input_name] = value
    
    def get_output(self, output_name: str) -> Any:
        """Get an output value."""
        return self.outputs.get(output_name)
    
    @abstractmethod
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the element logic."""
        pass
    
    def validate_inputs(self) -> bool:
        """Validate that all required inputs are provided."""
        for name, schema in self.input_schema.items():
            if schema.get('required', False) and name not in self.inputs:
                return False
        return True
    
    def validate_outputs(self) -> bool:
        """Validate that all required outputs are produced."""
        for name, schema in self.output_schema.items():
            if schema.get('required', False) and name not in self.outputs:
                return False
        return True
